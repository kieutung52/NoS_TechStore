package com.nos.backend_api.controllers;

import java.util.List;
import java.util.UUID;

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

import com.nos.backend_api.DTO.request.RequestDto.CreateAddressRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateAddressRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.AddressResponse;
import com.nos.backend_api.services.user.AddressService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
public class AddressController {
    
    private final AddressService addressService;

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<AddressResponse> createAddress(@Valid @RequestBody CreateAddressRequest request) {
        return addressService.createAddress(getCurrentUserId(), request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<AddressResponse> getAddress(@PathVariable Long id) {
        return addressService.getAddress(getCurrentUserId(), id);
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<List<AddressResponse>> getAllAddresses() {
        return addressService.getAllAddresses(getCurrentUserId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<AddressResponse> updateAddress(@PathVariable Long id, @Valid @RequestBody UpdateAddressRequest request) {
        return addressService.updateAddress(getCurrentUserId(), id, request);
    }

    @PutMapping("/{id}/set-default")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<Void> setDefault(@PathVariable Long id) {
        return addressService.setDefault(getCurrentUserId(), id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<Void> deleteAddress(@PathVariable Long id) {
        return addressService.deleteAddress(getCurrentUserId(), id);
    }
}