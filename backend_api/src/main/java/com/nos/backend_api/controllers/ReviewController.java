package com.nos.backend_api.controllers;

import java.util.List;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nos.backend_api.DTO.request.RequestDto.CreateReviewRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateReviewRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.ReviewResponse;
import com.nos.backend_api.services.product.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {
    
    private final ReviewService reviewService;

    private UUID getCurrentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @GetMapping("/products/{productId}")
    public ApiResponse<ResponseDto.PagedResponse<ReviewResponse>> getReviewsByProduct(
            @PathVariable UUID productId, 
            Pageable pageable) {
        return reviewService.getReviewsByProduct(productId, pageable);
    }

    @PostMapping(value = "/products/{productId}", consumes = "multipart/form-data") // Thêm consumes
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<ReviewResponse> createReview(
            @PathVariable UUID productId,
            @Valid @RequestPart("request") CreateReviewRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {
        return reviewService.createReview(getCurrentUserId(), productId, request, attachments);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<ReviewResponse> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request) {
        return reviewService.updateReview(getCurrentUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ApiResponse<Void> deleteReview(@PathVariable Long id) {
        return reviewService.deleteReview(getCurrentUserId(), id);
    }
}