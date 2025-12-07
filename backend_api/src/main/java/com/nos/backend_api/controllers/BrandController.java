package com.nos.backend_api.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nos.backend_api.DTO.request.RequestDto.CreateBrandRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateBrandRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.BrandResponse;
import com.nos.backend_api.services.product.BrandService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
public class BrandController {
    
    private final BrandService brandService;

    @GetMapping
    public ApiResponse<List<BrandResponse>> getAllBrands() {
        return brandService.getAllBrands();
    }

    @GetMapping("/{id}")
    public ApiResponse<BrandResponse> getBrand(@PathVariable Integer id) {
        return brandService.getBrand(id);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BrandResponse> updateBrand(
            @PathVariable Integer id,
            @Valid @RequestPart("request") UpdateBrandRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logoFile) {
        return brandService.updateBrand(id, request, logoFile);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteBrand(@PathVariable Integer id) {
        return brandService.deleteBrand(id);
    }

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BrandResponse> createBrand(
            @Valid @RequestPart("request") CreateBrandRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logoFile) {
        return brandService.createBrand(request, logoFile);
    }
}