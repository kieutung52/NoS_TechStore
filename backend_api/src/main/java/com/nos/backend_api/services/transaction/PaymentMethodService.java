package com.nos.backend_api.services.transaction;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.request.RequestDto.CreatePaymentRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.PaymentMethodResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.payment.PaymentMethod;
import com.nos.backend_api.repositories.PaymentMethodRepository;

import lombok.RequiredArgsConstructor;
@Service
@RequiredArgsConstructor
public class PaymentMethodService {
    private final PaymentMethodRepository paymentMethodRepository;

    @Transactional
    public ApiResponse<PaymentMethodResponse> createPaymentMethod(CreatePaymentRequest request) {
        PaymentMethod pm = paymentMethodRepository.save(PaymentMethod.builder()
                .methodName(request.getMethodName())
                .description(request.getDescription())
                .isActive(true)
                .build());
        return ApiResponse.success(mapToPaymentResponse(pm));
    }

    @Transactional(readOnly = true)
    public ApiResponse<PaymentMethodResponse> getPaymentMethodById(Integer id) {
        PaymentMethod pm = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        return ApiResponse.success(mapToPaymentResponse(pm));
    }

    @Transactional(readOnly = true)
    public ApiResponse<List<PaymentMethodResponse>> getAllPaymentMethods() {
        List<PaymentMethod> pms = paymentMethodRepository.findAll();
        return ApiResponse.success(pms.stream().map(this::mapToPaymentResponse).collect(Collectors.toList()));
    }

    public ApiResponse<Void> deletePaymentMethod(Integer id) {
        PaymentMethod pm = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        paymentMethodRepository.delete(pm);
        return ApiResponse.success(null, "Payment method deleted");
    }

    public ApiResponse<PaymentMethodResponse> updatePaymentMethod(Integer id, CreatePaymentRequest request) {
        PaymentMethod pm = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        pm.setMethodName(request.getMethodName());
        pm.setDescription(request.getDescription());
        pm = paymentMethodRepository.save(pm);
        return ApiResponse.success(mapToPaymentResponse(pm));
    }

    // PUT /admin/payment-methods/{id}/toggle
    @Transactional
    public ApiResponse<PaymentMethodResponse> togglePayment(Integer id) {
        PaymentMethod pm = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        pm.setActive(!pm.isActive());
        pm = paymentMethodRepository.save(pm);
        return ApiResponse.success(mapToPaymentResponse(pm));
    }

    // Optional: GET all active
    @Transactional(readOnly = true)
    public ApiResponse<List<PaymentMethodResponse>> getActivePayments() {
        List<PaymentMethod> pms = paymentMethodRepository.findByIsActive(true);
        return ApiResponse.success(pms.stream().map(this::mapToPaymentResponse).collect(Collectors.toList()));
    }

    private PaymentMethodResponse mapToPaymentResponse(PaymentMethod pm) {
        return PaymentMethodResponse.builder()
                .id(pm.getId())
                .methodName(pm.getMethodName())
                .description(pm.getDescription())
                .isActive(pm.isActive())
                .build();
    }
}