package com.nos.backend_api.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nos.backend_api.DTO.request.RequestDto.CreatePaymentRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.PaymentMethodResponse;
import com.nos.backend_api.services.transaction.PaymentMethodService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/payment-methods")
@RequiredArgsConstructor
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<PaymentMethodResponse>> getAllPaymentMethods() {
        return paymentMethodService.getAllPaymentMethods();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaymentMethodResponse> getPaymentMethodById(@PathVariable Integer id) {
        return paymentMethodService.getPaymentMethodById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaymentMethodResponse> createPaymentMethod(@Valid @RequestBody CreatePaymentRequest request) {
        return paymentMethodService.createPaymentMethod(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaymentMethodResponse> updatePaymentMethod(
            @PathVariable Integer id,
            @Valid @RequestBody CreatePaymentRequest request) {
        return paymentMethodService.updatePaymentMethod(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deletePaymentMethod(@PathVariable Integer id) {
        return paymentMethodService.deletePaymentMethod(id);
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaymentMethodResponse> togglePayment(@PathVariable Integer id) {
        return paymentMethodService.togglePayment(id);
    }

    @GetMapping("/active")
    public ApiResponse<List<PaymentMethodResponse>> getActivePayments() {
        return paymentMethodService.getActivePayments();
    }
}