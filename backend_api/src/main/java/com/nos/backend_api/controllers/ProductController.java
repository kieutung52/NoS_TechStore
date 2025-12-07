package com.nos.backend_api.controllers;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.nos.backend_api.DTO.request.RequestDto.CreateProductRequest;
import com.nos.backend_api.DTO.request.RequestDto.CreateVariantRequest;
import com.nos.backend_api.DTO.request.RequestDto.ImageActionRequest;
import com.nos.backend_api.DTO.request.RequestDto.ProductSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateProductRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateVariantRequest;
import com.nos.backend_api.DTO.request.RequestDto.UploadImageRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.ProductImageResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ProductResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ProductVariantResponse;
import com.nos.backend_api.services.product.ProductService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;

    @GetMapping
    public ApiResponse<ResponseDto.PagedResponse<ProductResponse>> getProducts(ProductSearchRequest request, Pageable pageable) {
        return productService.getProducts(request, pageable);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable UUID id) {
        return productService.getProduct(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productService.createProduct(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> updateProduct(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest request) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteProduct(@PathVariable UUID id) {
        return productService.deleteProduct(id);
    }

    @PostMapping("/{id}/variants")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductVariantResponse> createVariant(@PathVariable UUID id, @Valid @RequestBody CreateVariantRequest request) {
        return productService.createVariant(id, request);
    }

    @PutMapping("/{id}/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductVariantResponse> updateVariant(
            @PathVariable UUID id, 
            @PathVariable UUID variantId, 
            @Valid @RequestBody UpdateVariantRequest request) {
        return productService.updateVariant(id, variantId, request);
    }

    @DeleteMapping("/{id}/variants/{variantId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteVariant(@PathVariable UUID id, @PathVariable UUID variantId) {
        return productService.deleteVariant(id, variantId);
    }

    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductImageResponse> uploadImage(
            @PathVariable UUID id,
            @Valid @RequestPart("request") UploadImageRequest request,
            @RequestPart("file") MultipartFile file) {
        return productService.uploadImage(id, request, file);
    }

    @PutMapping(value = "/{id}/images/{imageId}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductImageResponse> replaceImage(
            @PathVariable UUID id,
            @PathVariable Long imageId,
            @Valid @RequestPart("request") ImageActionRequest request,
            @RequestPart("file") MultipartFile file) {
        return productService.replaceImage(id, imageId, request, file);
    }

    @PutMapping("/{id}/images/{imageId}/thumbnail")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> setThumbnail(@PathVariable UUID id, @PathVariable Long imageId) {
        return productService.setThumbnail(id, imageId);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteImage(@PathVariable UUID id, @PathVariable Long imageId) {
        return productService.deleteImage(id, imageId);
    }
}