package com.nos.backend_api.services.wallet;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors; 

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.data.enums.SendEmailType;
import com.nos.backend_api.DTO.data.enums.TransactionStatus;
import com.nos.backend_api.DTO.data.enums.TransactionType;
import com.nos.backend_api.DTO.request.RequestDto.ActivateWalletRequest;
import com.nos.backend_api.DTO.request.RequestDto.DepositRequest;
import com.nos.backend_api.DTO.request.RequestDto.ValidatePinRequest;
import com.nos.backend_api.DTO.request.RequestDto.WithdrawalRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.WalletResponse;
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
public class WalletService {
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final NotificationProducer notificationProducer;
    private final RedisService redisService;

    private String getWalletKey(UUID userId) { return "wallet:" + userId.toString();
    }
    private String getWalletTxnsKey(UUID userId, Pageable pageable) {
        String sortStr = pageable.getSort().isSorted() ?
            pageable.getSort().stream().map(o -> o.getProperty() + ":" + o.getDirection()).collect(Collectors.joining(","))
            : "default";
        return String.format("wallet:txns:%s:page:%d:size:%d:sort:%s",
            userId.toString(),
            pageable.getPageNumber(),
            pageable.getPageSize(),
            sortStr);
    }
    
    // POST /wallets/deposit
    @Transactional
    public ApiResponse<WalletResponse> deposit(UUID userId, DepositRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        BigDecimal newBalance = wallet.getBalance().add(request.getAmount());
        wallet.setBalance(newBalance);
        wallet = walletRepository.save(wallet);
        
        WalletTransaction txn = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType(TransactionType.DEPOSIT)
                .transactionStatus(TransactionStatus.COMPLETED)
                .amount(request.getAmount())
                .description("Deposit via " + request.getPaymentMethod())
     
               .build();
        transactionRepository.save(txn);
        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", wallet.getUser().getFullName());
            emailData.put("amount", request.getAmount());
            emailData.put("paymentMethod", request.getPaymentMethod());
            emailData.put("newBalance", newBalance);
            emailData.put("transactionDate", LocalDateTime.now());
            emailData.put("transactionId", txn.getId());
            emailData.put("status", txn.getTransactionStatus().name());
            emailData.put("type", txn.getTransactionType().name());
            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                wallet.getUser().getEmail(),
                SendEmailType.TRANSACTION_NOTIFICATION,
                emailData
            ));
        } catch (Exception e) {
            log.error("Failed to send deposit notification email for user: {}", userId, e);
        }

        evictWalletCache(userId); 
        return ApiResponse.success(buildWalletResponse(wallet));
    }

    // POST /wallets/withdrawal
    @Transactional
    public ApiResponse<WalletResponse> withdrawal(UUID userId, WithdrawalRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        if (!passwordEncoder.matches(request.getPin(), wallet.getPinHash())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }
        BigDecimal newBalance = wallet.getBalance().subtract(request.getAmount());
        wallet.setBalance(newBalance);
        wallet = walletRepository.save(wallet);
        WalletTransaction txn = WalletTransaction.builder()
                .wallet(wallet)
                .transactionType(TransactionType.WITHDRAWAL)
                .transactionStatus(TransactionStatus.COMPLETED)
                .amount(request.getAmount().negate())
                .description("Withdrawal")
                .build();
        transactionRepository.save(txn);
        
        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", wallet.getUser().getFullName());
            emailData.put("amount", request.getAmount());
            emailData.put("newBalance", newBalance);
            emailData.put("transactionDate", LocalDateTime.now());
            emailData.put("transactionId", txn.getId());
            emailData.put("status", txn.getTransactionStatus().name());
            emailData.put("type", txn.getTransactionType().name());
            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                wallet.getUser().getEmail(),
                SendEmailType.TRANSACTION_NOTIFICATION,
                emailData
            ));
        } catch (Exception e) {
            log.error("Failed to send withdrawal notification email for user: {}", userId, e);
        }

        evictWalletCache(userId); 
        return ApiResponse.success(buildWalletResponse(wallet));
    }

    // POST /wallets/validate-pin
    @Transactional(readOnly = true)
    public ApiResponse<Void> validatePin(UUID userId, ValidatePinRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (!passwordEncoder.matches(request.getPin(), wallet.getPinHash())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }
        return ApiResponse.success(null, "PIN valid");
    }

    // GET /wallets
    @Transactional(readOnly = true)
    public ApiResponse<WalletResponse> getWallet(UUID userId) {
        String cacheKey = getWalletKey(userId);
        WalletResponse cached = (WalletResponse) redisService.getValue(cacheKey);
        if (cached != null) {
            log.info("Cache hit for {}", cacheKey);
            return ApiResponse.success(cached);
        }
        
        log.warn("Cache miss for {}. Running DB query.", cacheKey);
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        WalletResponse response = buildWalletResponse(wallet);
        redisService.setValue(cacheKey, response, 1, java.util.concurrent.TimeUnit.HOURS);
        return ApiResponse.success(response);
    }

    // GET /wallets/transactions (paginated)
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<WalletTransactionResponse>> getTransactions(UUID userId, Pageable pageable) {
        String cacheKey = getWalletTxnsKey(userId, pageable);
        @SuppressWarnings("unchecked")
        ResponseDto.PagedResponse<WalletTransactionResponse> cached = (ResponseDto.PagedResponse<WalletTransactionResponse>) redisService.getValue(cacheKey);
        if (cached != null) {
            log.info("Cache hit for {}", cacheKey);
            return ApiResponse.success(cached);
        }

        log.warn("Cache miss for {}. Running DB query.", cacheKey);
        Page<WalletTransaction> page = transactionRepository.findAllByWalletUserId(userId, pageable);
        Page<WalletTransactionResponse> dtoPage = page.map(this::mapToTxnResponse);
        
        ResponseDto.PagedResponse<WalletTransactionResponse> pagedResponse = ResponseDto.PagedResponse.<WalletTransactionResponse>builder()
                .content(dtoPage.getContent())
                .page(dtoPage.getNumber())
                .size(dtoPage.getSize())
                .totalElements(dtoPage.getTotalElements())
                .totalPages(dtoPage.getTotalPages())
        
                .last(dtoPage.isLast())
                .build();
        redisService.setValue(cacheKey, pagedResponse, 1, java.util.concurrent.TimeUnit.HOURS);
        return ApiResponse.success(pagedResponse);
    }

    // POST /wallets/activate
    @Transactional
    public ApiResponse<WalletResponse> activateWallet(UUID userId, ActivateWalletRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (wallet.getPinHash() != null) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        if (!request.getNewPin().equals(request.getConfirmPin())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }
        wallet.setPinHash(passwordEncoder.encode(request.getNewPin()));
        wallet.setActive(true);
        wallet = walletRepository.save(wallet);

        evictWalletCache(userId);
        return ApiResponse.success(buildWalletResponse(wallet), "Wallet activated successfully");
    }

    private WalletResponse buildWalletResponse(Wallet wallet) {
        return ResponseDto.WalletResponse.builder()
                .id(wallet.getId())
                .balance(wallet.getBalance())
                .isActive(wallet.isActive())
                .pinSet(wallet.getPinHash() != null)
    
                .recentTransactions(transactionRepository.findByWalletId(wallet.getId(), PageRequest.of(0, 5))
                        .map(this::mapToTxnResponse).getContent())
                .build();
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


    private void evictWalletCache(UUID userId) {
        log.info("Evicting wallet caches for user {}", userId);
        redisService.deleteKey(getWalletKey(userId));
        redisService.deleteKeysByPattern("wallet:txns:" + userId.toString() + ":*");
    }
}