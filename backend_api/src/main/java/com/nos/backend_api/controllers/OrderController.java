package com.nos.backend_api.controllers;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nos.backend_api.DTO.request.RequestDto.AdminOrderSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.CancelOrderRequest;
import com.nos.backend_api.DTO.request.RequestDto.CreateOrderRequest;
import com.nos.backend_api.DTO.request.RequestDto.OrderSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.ShipOrderRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateOrderLocationRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.OrderResponse;
import com.nos.backend_api.services.order.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(getCurrentUserId(), request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<OrderResponse> getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id, getCurrentUserId());
    }

    @PutMapping("/{id}/deliver")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<OrderResponse> orderDelivered(@PathVariable UUID id) {
        return orderService.deliverOrder(id);
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<ResponseDto.PagedResponse<OrderResponse>> getUserOrders(OrderSearchRequest request, Pageable pageable) {
        return orderService.getUserOrders(getCurrentUserId(), request, pageable);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ResponseDto.PagedResponse<OrderResponse>> getAdminOrders(AdminOrderSearchRequest request, Pageable pageable) {
        return orderService.getAdminOrders(request, pageable);
    }

    @PutMapping("/admin/{id}/accept")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderResponse> acceptOrder(@PathVariable UUID id) {
        return orderService.acceptOrder(id);
    }

    @PutMapping("/admin/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderResponse> cancelOrder(@PathVariable UUID id, @Valid @RequestBody CancelOrderRequest request) {
        return orderService.cancelOrder(id, request);
    }

    @PutMapping("/admin/{id}/ship")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<OrderResponse> shipOrder(@PathVariable UUID id, @Valid @RequestBody ShipOrderRequest request) {
        return orderService.shipOrder(id, request);
    }

    @PutMapping("/{id}/track")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<OrderResponse> updateLocation(@PathVariable UUID id, @Valid @RequestBody UpdateOrderLocationRequest request) {
        return orderService.updateLocation(id, request, getCurrentUserId());
    }
}