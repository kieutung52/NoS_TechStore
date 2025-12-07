package com.nos.backend_api.services.transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.data.enums.SendEmailType;
import com.nos.backend_api.DTO.data.enums.TransactionStatus;
import com.nos.backend_api.DTO.data.enums.TransactionType;
import com.nos.backend_api.DTO.request.RequestDto.AdminTransactionSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.CreateTransactionRequest;
import com.nos.backend_api.DTO.request.RequestDto.TransactionSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateTransactionRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.WalletTransactionResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.payment.WalletTransaction;
import com.nos.backend_api.models.user_info.Wallet;
import com.nos.backend_api.repositories.WalletRepository;
import com.nos.backend_api.repositories.WalletTransactionRepository;
import com.nos.backend_api.services._system.NotificationProducer;
import com.nos.backend_api.services._system.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {
    private final WalletTransactionRepository txnRepository;
    private final WalletRepository walletRepository;
    private final NotificationProducer notificationProducer;
    private final RedisService redisService;

    // GET /transactions
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<WalletTransactionResponse>> getTransactions(UUID userId, TransactionSearchRequest request, Pageable pageable) {
        Specification<WalletTransaction> spec = (root, q, cb) -> cb.equal(root.get("wallet").get("user").get("id"), userId);
        if (request.getType() != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("transactionType"), request.getType()));
        if (request.getStatus() != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("transactionStatus"), request.getStatus()));
        if (request.getFromDate() != null) spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("transactionDate"), request.getFromDate().atStartOfDay()));
        if (request.getToDate() != null) spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("transactionDate"), request.getToDate().atTime(LocalTime.MAX)));
        Page<WalletTransaction> page = txnRepository.findAll(spec, pageable);
        Page<WalletTransactionResponse> dtoPage = page.map(this::mapToTxnResponse);
        ResponseDto.PagedResponse<WalletTransactionResponse> pagedResponse = ResponseDto.PagedResponse.<WalletTransactionResponse>builder()
                .content(dtoPage.getContent())
                .page(dtoPage.getNumber())
                .size(dtoPage.getSize())
                .totalElements(dtoPage.getTotalElements())
                .totalPages(dtoPage.getTotalPages())
 
               .last(dtoPage.isLast())
                .build();
        return ApiResponse.success(pagedResponse);
    }

    // GET /admin/transactions
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<WalletTransactionResponse>> getAdminTransactions(AdminTransactionSearchRequest request, Pageable pageable) {
        Specification<WalletTransaction> spec = (root, query, cb) -> cb.conjunction();
        if (request.getWalletId() != null) spec = spec.and((root, q, cb) -> cb.equal(root.get("wallet").get("id"), request.getWalletId()));
        spec = spec.and(buildUserSpec(request.getSearch()));
        Page<WalletTransaction> page = txnRepository.findAll(spec, pageable);
        Page<WalletTransactionResponse> dtoPage = page.map(this::mapToTxnResponse);

        ResponseDto.PagedResponse<WalletTransactionResponse> pagedResponse = ResponseDto.PagedResponse.<WalletTransactionResponse>builder()
                .content(dtoPage.getContent())
                .page(dtoPage.getNumber())
                .size(dtoPage.getSize())
                .totalElements(dtoPage.getTotalElements())
                .totalPages(dtoPage.getTotalPages())
 
               .last(dtoPage.isLast())
                .build();
        return ApiResponse.success(pagedResponse);
    }

    // POST /admin/transactions
    @Transactional
    public ApiResponse<WalletTransactionResponse> createTransaction(CreateTransactionRequest request) {
        Wallet wallet = walletRepository.findById(request.getWalletId()).orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        WalletTransaction txn = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType(request.getType())
                .transactionStatus(TransactionStatus.COMPLETED)
                .amount(request.getAmount())
                .order(/* find if id */ null)
            
                .description(request.getDescription())
                .build();
        txn = txnRepository.save(txn);
        BigDecimal delta = request.getType() == TransactionType.DEPOSIT ||
            request.getType() == TransactionType.REFUND ? request.getAmount() : request.getAmount().negate();
        wallet.setBalance(wallet.getBalance().add(delta));
        walletRepository.save(wallet);

        evictWalletCache(wallet.getUser().getId());

        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", wallet.getUser().getFullName());
            emailData.put("transactionType", request.getType());
            emailData.put("amount", request.getAmount());
            emailData.put("description", request.getDescription());
            emailData.put("newBalance", wallet.getBalance());
            emailData.put("transactionDate", LocalDateTime.now());

            emailData.put("transactionId", txn.getId());
            emailData.put("status", txn.getTransactionStatus().name());
            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                wallet.getUser().getEmail(),
                SendEmailType.TRANSACTION_NOTIFICATION,
                emailData
            ));
        } catch (Exception e) {
            log.error("Failed to send transaction notification email for wallet: {}", request.getWalletId(), e);
        }

        return ApiResponse.success(mapToTxnResponse(txn));
    }

    // PUT /admin/transactions/{id}
    @Transactional
    public ApiResponse<WalletTransactionResponse> updateTransaction(UUID id, UpdateTransactionRequest request) {
        WalletTransaction txn = txnRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        TransactionStatus oldStatus = txn.getTransactionStatus();
        if (request.getStatus() != null) txn.setTransactionStatus(request.getStatus());
        if (request.getDescription() != null) txn.setDescription(request.getDescription());
        txn = txnRepository.save(txn);
        if (oldStatus != TransactionStatus.COMPLETED && request.getStatus() == TransactionStatus.COMPLETED) {
            BigDecimal delta = txn.getTransactionType() == TransactionType.DEPOSIT ||
                txn.getTransactionType() == TransactionType.REFUND ? txn.getAmount() : txn.getAmount().negate();
            txn.getWallet().setBalance(txn.getWallet().getBalance().add(delta));
            walletRepository.save(txn.getWallet());
            evictWalletCache(txn.getWallet().getUser().getId());
        } else if (oldStatus == TransactionStatus.COMPLETED && request.getStatus() != TransactionStatus.COMPLETED) {
            BigDecimal delta = txn.getTransactionType() == TransactionType.DEPOSIT ||
                txn.getTransactionType() == TransactionType.REFUND ? txn.getAmount().negate() : txn.getAmount();
            txn.getWallet().setBalance(txn.getWallet().getBalance().add(delta));
            walletRepository.save(txn.getWallet());
            evictWalletCache(txn.getWallet().getUser().getId());
        }

        if (oldStatus != txn.getTransactionStatus()) {
            try {
                Map<String, Object> emailData = new HashMap<>();
                emailData.put("userName", txn.getWallet().getUser().getFullName());
                emailData.put("transactionId", txn.getId());
                emailData.put("type", txn.getTransactionType().name());
                emailData.put("status", txn.getTransactionStatus().name());
                emailData.put("amount", txn.getAmount());
                emailData.put("description", txn.getDescription());
                notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                    txn.getWallet().getUser().getEmail(),
                    SendEmailType.TRANSACTION_NOTIFICATION,
                    emailData
                ));
            } catch (Exception e) {
                log.error("Failed to send transaction status update email for transaction: {}", id, e);
            }
        }

        return ApiResponse.success(mapToTxnResponse(txn));
    }

    // DELETE /admin/transactions/{id}
    @Transactional
    public ApiResponse<Void> deleteTransaction(UUID id) {
        WalletTransaction txn = txnRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        UUID userId = txn.getWallet().getUser().getId();
        if (txn.getTransactionStatus() == TransactionStatus.COMPLETED) {
            BigDecimal delta = txn.getTransactionType() == TransactionType.DEPOSIT ||
                txn.getTransactionType() == TransactionType.REFUND ? txn.getAmount().negate() : txn.getAmount();
            txn.getWallet().setBalance(txn.getWallet().getBalance().add(delta));
            walletRepository.save(txn.getWallet());
            evictWalletCache(userId);
        }
        txnRepository.delete(txn);
        return ApiResponse.success(null, "Transaction deleted");
    }

    private Specification<WalletTransaction> buildUserSpec(TransactionSearchRequest request) {
        Specification<WalletTransaction> spec = (root, query, cb) -> cb.conjunction();
        if (request == null) return spec;

        if (request.getType() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("transactionType"), request.getType()));
        }
        if (request.getStatus() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("transactionStatus"), request.getStatus()));
        }
        if (request.getFromDate() != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("transactionDate"), request.getFromDate().atStartOfDay()));
        }
        if (request.getToDate() != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("transactionDate"), request.getToDate().atTime(LocalTime.MAX)));
        }
        return spec;
    }

    // =====================================
    // WALLET CACHE EVICTION
    // =====================================
    private void evictWalletCache(UUID userId) {
        log.info("Evicting wallet caches for user {}", userId);
        redisService.deleteKey("wallet:" + userId.toString());
        redisService.deleteKeysByPattern("wallet:txns:" + userId.toString() + ":*");
        log.info("Wallet cache evicted successfully for user {}", userId);
    }

    private WalletTransactionResponse mapToTxnResponse(WalletTransaction txn) {
        return ResponseDto.WalletTransactionResponse.builder()
                .id(txn.getId())
                .type(txn.getTransactionType())
                .status(txn.getTransactionStatus())
                .orderId(txn.getOrder() != null ? txn.getOrder().getId() : null)
             
               .transactionDate(txn.getTransactionDate())
                .description(txn.getDescription())
                .amount(txn.getAmount())
                .build();
    }
}