package com.nos.backend_api.controllers;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nos.backend_api.DTO.request.RequestDto.AdminTransactionSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.CreateTransactionRequest;
import com.nos.backend_api.DTO.request.RequestDto.TransactionSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateTransactionRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.WalletTransactionResponse;
import com.nos.backend_api.services.transaction.TransactionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {
    
    private final TransactionService transactionService;

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<ResponseDto.PagedResponse<WalletTransactionResponse>> getTransactions(
            TransactionSearchRequest request, 
            Pageable pageable) {
        return transactionService.getTransactions(getCurrentUserId(), request, pageable);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ResponseDto.PagedResponse<WalletTransactionResponse>> getAdminTransactions(
            AdminTransactionSearchRequest request, 
            Pageable pageable) {
        return transactionService.getAdminTransactions(request, pageable);
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<WalletTransactionResponse> createTransaction(@Valid @RequestBody CreateTransactionRequest request) {
        return transactionService.createTransaction(request);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<WalletTransactionResponse> updateTransaction(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateTransactionRequest request) {
        return transactionService.updateTransaction(id, request);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteTransaction(@PathVariable UUID id) {
        return transactionService.deleteTransaction(id);
    }
}