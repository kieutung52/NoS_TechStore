package com.nos.backend_api.controllers;

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

import com.nos.backend_api.DTO.request.RequestDto.AddCartItemRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateCartItemRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.CartResponse;
import com.nos.backend_api.services.shopping_cart.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/carts")
@RequiredArgsConstructor
public class CartController {
    
    private final CartService cartService;

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<CartResponse> getCart() {
        return cartService.getCart(getCurrentUserId());
    }

    @PostMapping("/items")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<CartResponse> addItem(@Valid @RequestBody AddCartItemRequest request) {
        return cartService.addItem(getCurrentUserId(), request);
    }

    @PutMapping("/items/{variantId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<CartResponse> updateItem(@PathVariable UUID variantId, @Valid @RequestBody UpdateCartItemRequest request) {
        return cartService.updateItem(getCurrentUserId(), variantId, request);
    }

    @DeleteMapping("/items/{variantId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<Void> deleteItem(@PathVariable UUID variantId) {
        return cartService.deleteItem(getCurrentUserId(), variantId);
    }

    @DeleteMapping("/clear")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<Void> clearCart() {
        return cartService.clearCart(getCurrentUserId());
    }
}