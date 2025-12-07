package com.nos.backend_api.services.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.data.enums.OrderStatus;
import com.nos.backend_api.DTO.request.RequestDto.ReportSearchRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.AnalyticsOverviewResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ReportDailyResponse;
import com.nos.backend_api.models.admin.ReportDaily;
import com.nos.backend_api.repositories.AccountRepository;
import com.nos.backend_api.repositories.OrderDetailRepository;
import com.nos.backend_api.repositories.OrderRepository;
import com.nos.backend_api.repositories.ReportDailyRepository;
import com.nos.backend_api.repositories.ReviewRepository;
import com.nos.backend_api.repositories.ShoppingCartRepository;
import com.nos.backend_api.repositories.WalletRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final ReportDailyRepository reportDailyRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final AccountRepository accountRepository;
    private final ShoppingCartRepository cartRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final WalletRepository walletRepository;

    // GET /admin/analytics/daily
    @Transactional(readOnly = true)
    public ApiResponse<List<ReportDailyResponse>> getDailyReports(ReportSearchRequest request) {
        List<ReportDaily> reports = reportDailyRepository.findByReportDateBetween(request.getFromDate(), request.getToDate());
        return ApiResponse.success(reports.stream().map(this::mapToReportDailyResponse).collect(Collectors.toList()));
    }

    // GET /admin/analytics/overview
    @Transactional(readOnly = true)
    public ApiResponse<AnalyticsOverviewResponse> getOverview() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        
        BigDecimal todayRevenue = orderRepository.getTotalRevenueFromDate(todayStart);
        int todayOrders = (int) orderRepository.countByOrderDateGreaterThanEqualAndStatus(todayStart, OrderStatus.DELIVERED);
        int activeUsers = (int) accountRepository.countByActive(true);
        BigDecimal totalBalance = walletRepository.getTotalActiveBalance();
        
        AnalyticsOverviewResponse overview = AnalyticsOverviewResponse.builder()
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .todayOrders(todayOrders)
                .activeUsers(activeUsers)
                .totalBalance(totalBalance != null ? totalBalance : BigDecimal.ZERO)
                .build();
        return ApiResponse.success(overview);
    }

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void generateDailyReport() {
        LocalDate date = LocalDate.now().minusDays(1);
        if (reportDailyRepository.existsById(date)) return;

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        BigDecimal revenue = orderRepository.getTotalRevenueFromDate(start);
        int orders = (int) orderRepository.countByOrderDateBetweenAndStatus(start, end, OrderStatus.DELIVERED);
        int productsSold = orderDetailRepository.sumQuantityByOrderDateBetween(start, end);
        int newUsers = (int) accountRepository.countByCreatedAtBetween(start, end);
        int itemsInCart = cartRepository.sumItemsInActiveCarts();
        int positiveReviews = (int) reviewRepository.countByCreatedAtBetweenAndRatingGreaterThanEqual(start, end, 4);
        int negativeReviews = (int) reviewRepository.countByCreatedAtBetweenAndRatingLessThan(start, end, 3);
        String bestProducts = getBestSellingJson(date);

        ReportDaily report = ReportDaily.builder()
                .reportDate(date)
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalOrders(orders)
                .totalProductsSold(productsSold)
                .newUsersRegistered(newUsers)
                .totalItemsInActiveCart(itemsInCart)
                .positiveReviews(positiveReviews)
                .negativeReviews(negativeReviews)
                .bestSellingProductsJson(bestProducts)
                .build();
        reportDailyRepository.save(report);
    }

    private ReportDailyResponse mapToReportDailyResponse(ReportDaily report) {
        return ResponseDto.ReportDailyResponse.builder()
                .reportDate(report.getReportDate())
                .totalRevenue(report.getTotalRevenue())
                .totalOrders(report.getTotalOrders())
                .totalProductsSold(report.getTotalProductsSold())
                .newUsersRegistered(report.getNewUsersRegistered())
                .totalItemsInActiveCart(report.getTotalItemsInActiveCart())
                .positiveReviews(report.getPositiveReviews())
                .negativeReviews(report.getNegativeReviews())
                .bestSellingProducts(report.getBestSellingProductsJson())
                .build();
    }

    private String getBestSellingJson(LocalDate date) {
        return "{}";  // JSON string
    }
}