package com.nos.backend_api.DTO.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.nos.backend_api.DTO.data.enums.OrderStatus;
import com.nos.backend_api.DTO.data.enums.TransactionStatus;
import com.nos.backend_api.DTO.data.enums.TransactionType;
import com.nos.backend_api.DTO.data.enums.UserRole;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Builder
public class ResponseDto {

    // Auth Responses
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntrospectResponse {
        boolean valid;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private Long expiresIn; // seconds
        private UserResponse user;
    }

    // User Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserResponse {
        private UUID id;
        private String email;
        private String fullName;
        private LocalDate dateOfBirth;
        private UserRole role;
        private Boolean active;
        private WalletSummaryResponse wallet;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WalletSummaryResponse {
        private UUID id;
        private BigDecimal balance;
        private Boolean isActive;
        private Boolean pinSet;
    }

    // Address Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AddressResponse {
        private Long id;
        private String recipientFullName;
        private String recipientPhone;
        private String district;
        private String city;
        private String country;
        private Double latitude;
        private Double longitude;
        private String note;
        private Boolean isDefault;
    }

    // Wallet Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WalletResponse {
        private UUID id;
        private BigDecimal balance;
        private Boolean isActive;
        private Boolean pinSet;
        private List<WalletTransactionResponse> recentTransactions; // Last 5
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WalletTransactionResponse {
        private UUID id;
        private TransactionType type;
        private TransactionStatus status;
        private UUID orderId; // Optional
        private LocalDateTime transactionDate;
        private String description;
        private BigDecimal amount;
    }

    // Cart Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CartResponse {
        private UUID id;
        private List<CartItemResponse> items;
        private BigDecimal totalAmount;
        private Integer totalItems;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CartItemResponse {
        private UUID productVariantId;
        private String productName;
        private BigDecimal price;
        private Integer quantity;
        private LocalDateTime addedAt;
        private Set<String> imageUrls; // Thumbnails
    }

    // Category/Brand Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryResponse {
        private Integer id;
        private String name;
        private String description;
        private Integer parentCategoryId;
        private List<CategoryResponse> children; // Recursive
        private List<ProductSummaryResponse> products; // Summary
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BrandResponse {
        private Integer id;
        private String name;
        private String description;
        private String logoUrl;
        private List<ProductSummaryResponse> products;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductSummaryResponse {
        private UUID id;
        private String name;
        private BigDecimal price; // Min variant
        private Double averageRating;
        private String thumbnailUrl;
    }

    // Review Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReviewResponse {
        private Long id;
        private UUID userId;
        private String userName;
        private Integer rating;
        private String comment;
        private Set<String> attachmentUrls;
        private LocalDateTime createdAt;
    }

    // Product Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductResponse {
        private UUID id;
        private String name;
        private String description;
        private Integer categoryId;
        private Integer brandId;
        private Integer quantityInStock;
        private Integer quantitySales;
        private Boolean isPublished;
        private Double averageRating;
        private List<ProductVariantResponse> variants;
        private List<ReviewResponse> recentReviews;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductVariantResponse {
        private UUID id;
        private String sku;
        private BigDecimal price;
        private Map<String, String> attributes;
        private List<ProductImageResponse> images;
        private Integer stock; // From product
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductImageResponse {
        private Long id;
        private String imageUrl;
        private String cloudinaryPublicId;
        private Boolean isThumbnail;
        private String altText;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PaymentMethodResponse {
        private Integer id;
        private String methodName;
        private String description;
        private boolean isActive;
    }

    // Order Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderResponse {
        private UUID id;
        private UUID userId;
        private Long addressId;
        private Integer paymentMethodId;
        private BigDecimal totalAmount;
        private BigDecimal shippingFee;
        private OrderStatus status;
        private LocalDateTime orderDate;
        private LocalDateTime dueDate;
        private LocalDateTime shippedDate;
        private String trackingNumber;
        private LocalDateTime estimatedDeliveryDate;
        private Double latitude;
        private Double longitude;
        private List<OrderDetailResponse> orderDetails;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderDetailResponse {
        private Long id;
        private UUID productVariantId;
        private String productName;
        private Integer quantity;
        private BigDecimal priceEach;
        private ReviewResponse review;
    }

    // Analytics Responses
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReportDailyResponse {
        private LocalDate reportDate;
        private BigDecimal totalRevenue;
        private Integer totalOrders;
        private Integer totalProductsSold;
        private Integer newUsersRegistered;
        private Integer totalItemsInActiveCart;
        private Integer positiveReviews;
        private Integer negativeReviews;
        private String bestSellingProducts; // Parsed JSON
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AnalyticsOverviewResponse {
        private BigDecimal todayRevenue;
        private Integer todayOrders;
        private Integer activeUsers;
        private BigDecimal totalBalance; // All wallets
    }

    // Paged wrapper
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PagedResponse<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
    }
}
