package com.nos.backend_api.DTO.data.redis_cache;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
public class RedisData {
    public static final String BRAND_IDS = "brand:ids";
    public static final String BRAND_DATA = "brand:data";

    public static final String CATEGORY_IDS = "category:ids";
    public static final String CATEGORY_DATA = "category:data";

    public static final String PRODUCT_IDS = "product:ids";
    public static final String PRODUCT_DATA = "product:data";
    public static final String PRODUCT_SEARCH = "product:search"; // prodcut:serach:{query}

    public static final String PRODUCT_VARIANT_IDS = "product_variant:ids";
    public static final String PRODUCT_VARIANT_DATA = "product_variant:data";

    public static final String PRODUCT_IMAGE_IDS = "product_image:ids";
    public static final String PRODUCT_IMAGE_DATA = "product_image:data";

    public static final String REVIEW_IDS = "review:ids";
    public static final String REVIEW_DATA = "review:data";

    public static final String REVIEW_ATTACHMENT_IDS = "review_attachment:ids";
    public static final String REVIEW_ATTACHMENT_DATA = "review_attachment:data";

    public static final String CART_IDS = "cart:ids";
    public static final String CART_DATA = "cart:data";
    public static final String CART_ITEM_DATA = "cart_item:data"; // key dung chung voi cart

    public static final String PAYMENT_METHOD_IDS = "payment_method:ids";
    public static final String PAYMENT_METHOD_DATA = "payment_method:data";

    public static final String TRANSACTION_IDS = "transaction:ids";
    public static final String TRANSACTION_DATA = "transaction:data";

    public static final String ORDER_IDS = "order:ids";
    public static final String ORDER_DATA = "order:data";

    public static final String ORDER_DETAILS_IDS = "order_details:ids";
    public static final String ORDER_DETAILS_DATA = "order_details:data";

    public static final String WALLET_IDS = "wallet:ids";
    public static final String WALLET_DATA = "wallet:data";

    public static final String USER_IDS = "user:ids";
    public static final String USER_DATA = "user:data";

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class BrandRedis {
        private Integer id;
        private String name;
        private String description;
        private String logoUrl;
        private String cloudinaryPublicId;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class CategoryRedis {
        private Integer id;
        private String name;
        private String description;
        private Integer parentCategoryId;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class ProductRedis {
        private String id;
        private String name;
        private String description;
        private Integer categoryId;
        private Integer brandId;
        private Boolean isPublished;
        private Integer quantityInStock;
        private Integer quantitySales;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class ProductVariantRedis {
        private String id;
        private String productId;
        private String sku;
        private String attributes;
        private BigDecimal price;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class ProductImageRedis {
        private Long id;
        private String productVariantId;
        private String imageUrl;
        private String cloudinaryPublicId;
        private Boolean isThumbnail;
        private String altText;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class ReviewRedis {
        private Long id;
        private String userId;
        private String productId;
        private Long orderDetailId;
        private Integer rating;
        private String comment;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class ReviewAttachmentRedis {
        private Long id;
        private Long reviewId;
        private String attachmentUrl;
        private String cloudinaryPublicId;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class PaymentMethodRedis {
        private Integer id;
        private String name;
        private String description;
        private Boolean isActive;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class UserRedis {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private Boolean active;
        private String role;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class WalletRedis {
        private Long id;
        private String userId;
        private BigDecimal balance;
        private Boolean isActive;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class TransactionRedis {
        private String id;
        private Long walletId;
        private BigDecimal amount;
        private String type;
        private String status;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class OrderRedis {
        private String id;
        private String userId;
        private Long addressId;
        private Integer paymentMethodId;
        private BigDecimal totalAmount;
        private BigDecimal shippingFee;
        private String status;
        private String orderDate;
        private String dueDate;
        private String shippedDate;
        private String trackingNumber;
        private Double latitude;
        private Double longitude;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class OrderDetailRedis {
        private Long id;
        private String orderId;
        private String productVariantId;
        private Integer quantity;
        private BigDecimal priceEach;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class CartRedis {
        private String id;
        private String userId;
    }

    @Data
    @AllArgsConstructor
    @Builder
    @NoArgsConstructor
    public static class CartItemRedis {
        private String id; // dung chung id voi Cart
        private String productVariantId;
        private Integer quantity;
    }
}
