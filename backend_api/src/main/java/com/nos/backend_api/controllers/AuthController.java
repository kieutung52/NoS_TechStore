package com.nos.backend_api.controllers;

import java.text.ParseException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nimbusds.jose.JOSEException;
import com.nos.backend_api.DTO.request.RequestDto.ForgotPasswordRequest;
import com.nos.backend_api.DTO.request.RequestDto.IntrospectRequest;
import com.nos.backend_api.DTO.request.RequestDto.LoginRequest;
import com.nos.backend_api.DTO.request.RequestDto.OtpValidationRequest;
import com.nos.backend_api.DTO.request.RequestDto.RefreshTokenRequest;
import com.nos.backend_api.DTO.request.RequestDto.RegisterRequest;
import com.nos.backend_api.DTO.request.RequestDto.ResetPasswordRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.AuthResponse;
import com.nos.backend_api.DTO.response.ResponseDto.IntrospectResponse;
import com.nos.backend_api.services.user.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody IntrospectRequest request) throws JOSEException, ParseException {
        return authService.logout(request.getToken());
    }

    @PostMapping("/refresh-token")
    public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refreshToken(request);
    }

    @PostMapping("/generate-otp")
    public ApiResponse<Void> generateOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.generateOtp(request.getEmail(), com.nos.backend_api.DTO.data.enums.OtpType.FORGOT_PASSWORD);
    }

    @PostMapping("/validate-otp")
    public ApiResponse<Void> validateOtp(@Valid @RequestBody OtpValidationRequest request) {
        return authService.validateOtp(request);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@Valid @RequestBody IntrospectRequest request) throws JOSEException, ParseException {
        return ApiResponse.success(authService.introspect(request));
    }
}