package com.nos.backend_api.DTO.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.hibernate.validator.constraints.Length;
import org.springframework.web.multipart.MultipartFile;

import com.nos.backend_api.DTO.data.enums.OrderStatus;
import com.nos.backend_api.DTO.data.enums.OtpType;
import com.nos.backend_api.DTO.data.enums.TransactionStatus;
import com.nos.backend_api.DTO.data.enums.TransactionType;
import com.nos.backend_api.DTO.data.enums.UserRole;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@Builder
public class RequestDto {

    // Auth Requests
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IntrospectRequest {
        private String token;
    }    

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;
        @NotBlank
        @Length(min = 6)
        private String password;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RegisterRequest {
        @Email
        @NotBlank
        private String email;
        @NotBlank
        @Length(min = 6)
        private String password;
        @NotBlank
        private String fullName;
        @Past
        private LocalDate dateOfBirth;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank
        private String refreshToken;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OtpRequest {
        @Email
        private String email; // For forgot
        private OtpType type; // REGISTER, FORGOT, etc.
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OtpValidationRequest {
        @NotBlank
        private String code;

        @Email
        @NotBlank
        private String email; // Or from JWT
        
        @NotNull
        private OtpType type;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ForgotPasswordRequest {
        @Email
        @NotBlank
        private String email;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank
        @Length(min = 6)
        private String newPassword;
        @Email
        @NotBlank
        private String email;
    }

    // User Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateUserRequest {
        @Email
        @NotBlank
        private String email;
        @NotBlank
        @Length(min = 6)
        private String password;
        @NotBlank
        private String fullName;
        private LocalDate dateOfBirth;
        private UserRole role; // Default USER
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateUserRequest {
        private String fullName;
        private LocalDate dateOfBirth;
        private Boolean active; // For admin
        private UserRole role;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateProfileRequest {
        private String fullName;
        private LocalDate dateOfBirth;
    }

    // Address Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateAddressRequest {
        @NotBlank
        private String recipientFullName;
        @NotBlank
        private String recipientPhone;
        @NotBlank
        private String district;
        @NotBlank
        private String city;
        @NotBlank
        private String country;
        private Double latitude;
        private Double longitude;
        private String note;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateAddressRequest {
        @NotBlank
        private String recipientFullName;
        @NotBlank
        private String recipientPhone;
        @NotBlank
        private String district;
        @NotBlank
        private String city;
        @NotBlank
        private String country;
        private Double latitude;
        private Double longitude;
        private String note;
        private Boolean isDefault;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OtpData {
        private String code;
        private String type;
    }


    // Wallet Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActivateWalletRequest {
        @NotBlank(message = "PIN cannot be blank")
        @Length(min = 6, max = 6, message = "PIN must be exactly 6 digits")
        @Pattern(regexp = "\\d+", message = "PIN must contain only numbers")
        private String newPin;

        @NotBlank(message = "Confirm PIN cannot be blank")
        private String confirmPin;
    }
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DepositRequest {
        @NotNull
        @DecimalMin("0.01")
        private BigDecimal amount;
        @NotBlank
        private String paymentMethod; // External gateway
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WithdrawalRequest {
        @NotNull
        @DecimalMin("0.01")
        private BigDecimal amount;
        @NotBlank
        @Length(min = 4)
        private String pin;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ValidatePinRequest {
        @NotBlank
        @Length(min = 4)
        private String pin;
    }

    // Cart Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AddCartItemRequest {
        @NotNull
        private UUID productVariantId;
        @Min(1)
        private Integer quantity;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateCartItemRequest {
        @Min(1)
        private Integer quantity;
    }

    // Category/Brand Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateCategoryRequest {
        @NotBlank
        private String name;
        private String description;
        private Integer parentCategoryId;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateCategoryRequest {
        @NotBlank
        private String name;
        private String description;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateBrandRequest {
        @NotBlank
        private String name;
        private String description;
        private String logoUrl; // Multipart upload separate
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateBrandRequest {
        private String name;
        private String description;
        private String logoUrl;
    }

    // Review Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateReviewRequest {
        @Min(1) @Max(5)
        private Integer rating;
        private String comment;
        // Multipart for attachments
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateReviewRequest {
        @Min(1) @Max(5)
        private Integer rating;
        private String comment;
    }

    // Product Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateProductRequest {
        @NotBlank
        private String name;
        private String description;
        @NotNull
        private Integer categoryId;
        @NotNull
        private Integer brandId;
        private Boolean isPublished;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateProductRequest {
        private String name;
        private String description;
        private Integer categoryId;
        private Integer brandId;
        private Boolean isPublished;
        private Integer quantityInStock;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ProductSearchRequest {
        private String search;
        private Integer categoryId;
        private Integer brandId;
        private Map<String, String> attributes;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private Boolean isPublished;
        // @Min(0)
        // private Integer page;
        // @Min(1)
        // private Integer size;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateVariantRequest {
        @NotBlank
        private String sku;
        @NotNull
        private BigDecimal price;
        private Map<String, String> attributes;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateVariantRequest {
        private String sku;
        private BigDecimal price;
        private Map<String, String> attributes;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UploadImageRequest {
        // MultipartFile image (handled separately)
        private String altText;
        private Boolean isThumbnail;
        private UUID targetId;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImageActionRequest {
        private String publicId;  // For replace/delete
        private MultipartFile file;  // For replace only
        private String altText;
        private Boolean isThumbnail;
    }

    // Order Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateOrderRequest {
        @NotNull
        private Long addressId;
        @NotNull
        private Integer paymentMethodId;
        private String note;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TogglePaymentRequest {
        private Boolean isActive;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreatePaymentRequest {
        private String methodName;
        private String description;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderSearchRequest {
        private OrderStatus status;
        private LocalDate fromDate;
        private LocalDate toDate;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AdminOrderSearchRequest {
        private UUID userId;
        private OrderSearchRequest search; // Embed
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CancelOrderRequest {
        private String reason;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ShipOrderRequest {
        @NotBlank
        private String trackingNumber;
        private LocalDateTime estimatedDeliveryDate;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateOrderLocationRequest {
        private Double latitude;
        private Double longitude;
    }

    // Transaction Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TransactionSearchRequest {
        private TransactionType type;
        private TransactionStatus status;
        private LocalDate fromDate;
        private LocalDate toDate;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AdminTransactionSearchRequest {
        private UUID walletId;
        private TransactionSearchRequest search; // Embed
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateTransactionRequest {
        @NotNull
        private UUID walletId;
        @NotNull
        private TransactionType type;
        @NotNull
        private BigDecimal amount;
        private UUID orderId;
        private String description;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UpdateTransactionRequest {
        private TransactionStatus status;
        private String description;
    }

    // Analytics Requests
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReportSearchRequest {
        private LocalDate fromDate;
        private LocalDate toDate;
    }
}
