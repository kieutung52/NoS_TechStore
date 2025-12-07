package com.nos.backend_api.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nos.backend_api.DTO.request.RequestDto.ReportSearchRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.AnalyticsOverviewResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ReportDailyResponse;
import com.nos.backend_api.services.analytics.AnalyticsService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;

    @GetMapping("/daily")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<ReportDailyResponse>> getDailyReports(@Valid ReportSearchRequest request) {
        return analyticsService.getDailyReports(request);
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AnalyticsOverviewResponse> getOverview() {
        return analyticsService.getOverview();
    }
}