package com.nos.backend_api.controllers;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nos.backend_api.DTO.request.RequestDto.ActivateWalletRequest;
import com.nos.backend_api.DTO.request.RequestDto.DepositRequest;
import com.nos.backend_api.DTO.request.RequestDto.ValidatePinRequest;
import com.nos.backend_api.DTO.request.RequestDto.WithdrawalRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.WalletResponse;
import com.nos.backend_api.DTO.response.ResponseDto.WalletTransactionResponse;
import com.nos.backend_api.services.wallet.WalletService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {
    
    private final WalletService walletService;

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<WalletResponse> deposit(@Valid @RequestBody DepositRequest request) {
        return walletService.deposit(getCurrentUserId(), request);
    }

    @PostMapping("/withdrawal")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<WalletResponse> withdrawal(@Valid @RequestBody WithdrawalRequest request) {
        return walletService.withdrawal(getCurrentUserId(), request);
    }

    @PostMapping("/validate-pin")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<Void> validatePin(@Valid @RequestBody ValidatePinRequest request) {
        return walletService.validatePin(getCurrentUserId(), request);
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<WalletResponse> getWallet() {
        return walletService.getWallet(getCurrentUserId());
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<ResponseDto.PagedResponse<WalletTransactionResponse>> getTransactions(Pageable pageable) {
        return walletService.getTransactions(getCurrentUserId(), pageable);
    }

    @PostMapping("/activate")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<WalletResponse> activateWallet(@Valid @RequestBody ActivateWalletRequest request) {
        return walletService.activateWallet(getCurrentUserId(), request);
    }
}