package com.nos.backend_api.services.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.data.enums.OrderStatus;
import com.nos.backend_api.DTO.data.enums.SendEmailType;
import com.nos.backend_api.DTO.data.enums.TransactionStatus;
import com.nos.backend_api.DTO.data.enums.TransactionType;
import com.nos.backend_api.DTO.data.enums.UserRole;
import com.nos.backend_api.DTO.request.RequestDto.AdminOrderSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.CancelOrderRequest;
import com.nos.backend_api.DTO.request.RequestDto.CreateOrderRequest;
import com.nos.backend_api.DTO.request.RequestDto.OrderSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.ShipOrderRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateOrderLocationRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.OrderDetailResponse;
import com.nos.backend_api.DTO.response.ResponseDto.OrderResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ReviewResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.payment.Order;
import com.nos.backend_api.models.payment.OrderDetail;
import com.nos.backend_api.models.payment.PaymentMethod;
import com.nos.backend_api.models.payment.WalletTransaction;
import com.nos.backend_api.models.product.ProductVariant;
import com.nos.backend_api.models.product.Review;
import com.nos.backend_api.models.product.ReviewAttachment;
import com.nos.backend_api.models.shopping_cart.CartItem;
import com.nos.backend_api.models.shopping_cart.ShoppingCart;
import com.nos.backend_api.models.user_info.Account;
import com.nos.backend_api.models.user_info.Address;
import com.nos.backend_api.repositories.AccountRepository;
import com.nos.backend_api.repositories.AddressRepository;
import com.nos.backend_api.repositories.CartItemRepository;
import com.nos.backend_api.repositories.OrderDetailRepository;
import com.nos.backend_api.repositories.OrderRepository;
import com.nos.backend_api.repositories.PaymentMethodRepository;
import com.nos.backend_api.repositories.ProductRepository;
import com.nos.backend_api.repositories.ShoppingCartRepository;
import com.nos.backend_api.repositories.WalletRepository;
import com.nos.backend_api.repositories.WalletTransactionRepository;
import com.nos.backend_api.services._system.NotificationProducer;
import com.nos.backend_api.services._system.RedisService;
import com.nos.backend_api.DTO.data.redis_cache.RedisData;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final AddressRepository addressRepository;
    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final AccountRepository accountRepository;
    private final WalletTransactionRepository txnRepository;
    private final WalletRepository walletRepository;
    private final NotificationProducer notificationProducer;
    private final RedisService redisService;

    // =====================================
    // POST /orders
    // =====================================
    @Transactional
    public ApiResponse<OrderResponse> createOrder(UUID userId, CreateOrderRequest request) {
        Account user = accountRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        Address address = addressRepository.findById(request.getAddressId())
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        PaymentMethod pm = paymentMethodRepository.findById(request.getPaymentMethodId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        List<CartItem> items = cartItemRepository.findAllByCartId(cart.getId());
        if (items.isEmpty())
            throw new AppException(ErrorCode.BAD_REQUEST);

        BigDecimal total = items.stream()
                .map(item -> item.getProductVariant().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shippingFee = calculateShippingFee(address);

        Order order = orderRepository.save(Order.builder()
                .user(user)
                .address(address)
                .paymentMethod(pm)
                .totalAmount(total.add(shippingFee))
                .shippingFee(shippingFee)

                .status(OrderStatus.PENDING)
                .orderDate(LocalDateTime.now())
                .build());
        java.util.Set<UUID> productIdsToEvict = new java.util.HashSet<>();

        items.forEach(item -> {
            ProductVariant variant = item.getProductVariant();
            if (variant.getProduct().getQuantityInStock() < item.getQuantity())
                throw new AppException(ErrorCode.BAD_REQUEST);
            variant.getProduct().setQuantityInStock(
                    variant.getProduct().getQuantityInStock() - item.getQuantity());
            variant.getProduct().setQuantitySales(
                    variant.getProduct().getQuantitySales() + item.getQuantity());
            productRepository.save(variant.getProduct());

            productIdsToEvict.add(variant.getProduct().getId());

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .productVariant(variant)
                    .quantity(item.getQuantity())
                    .priceEach(variant.getPrice())

                    .build();
            orderDetailRepository.save(detail);
        });

        evictProductCacheAfterOrder(productIdsToEvict);
        cartItemRepository.deleteAllByCartId(cart.getId());

        log.info(pm.getMethodName());
        if (pm.getMethodName() != null && pm.getMethodName().equalsIgnoreCase("Wallet")) {
            log.info("Processing Wallet payment for order: {}, user: {}, amount: {}", order.getId(), userId,
                    total.add(shippingFee));

            if (user.getWallet() == null) {
                log.error("User {} does not have a wallet", userId);
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            BigDecimal requiredAmount = total.add(shippingFee);
            BigDecimal currentBalance = user.getWallet().getBalance();

            if (currentBalance.compareTo(requiredAmount) < 0) {
                log.warn("Insufficient wallet balance. Required: {}, Available: {}", requiredAmount, currentBalance);
                throw new AppException(ErrorCode.BAD_REQUEST);
            }

            WalletTransaction txn = WalletTransaction.builder()
                    .wallet(user.getWallet())
                    .transactionType(TransactionType.PURCHASE)
                    .transactionStatus(TransactionStatus.COMPLETED)
                    .amount(requiredAmount.negate())
                    .order(order)
                    .description("Order " + order.getId())
                    .build();
            txnRepository.save(txn);

            BigDecimal newBalance = currentBalance.subtract(requiredAmount);
            user.getWallet().setBalance(newBalance);
            walletRepository.save(user.getWallet());

            log.info("Wallet payment successful. New balance: {}", newBalance);

            evictWalletCache(userId);
        } else {
            log.info("Payment method is not Wallet: {}", pm.getMethodName());
        }

        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", user.getFullName());
            emailData.put("orderId", order.getId());
            emailData.put("totalAmount", order.getTotalAmount());
            emailData.put("orderDate", order.getOrderDate());
            emailData.put("shippingAddress",
                    address.getDistrict() + ", " + address.getCity() + ", " + address.getCountry());
            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                    user.getEmail(),
                    SendEmailType.ORDER_SUCCESS,
                    emailData));
        } catch (Exception e) {
            log.error("Failed to send order confirmation email for order: {}", order.getId(), e);
        }
        return ApiResponse.success(mapToOrderResponse(order));
    }

    // =====================================
    // GET /orders/{id}
    // =====================================
    @Transactional(readOnly = true)
    public ApiResponse<OrderResponse> getOrder(UUID id, UUID userId) {
        Order order = orderRepository.findById(id)
                .filter(o -> o.getUser().getId().equals(userId) || isAdmin(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        return ApiResponse.success(mapToOrderResponse(order));
    }

    // =====================================
    // GET /orders
    // =====================================
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<OrderResponse>> getUserOrders(UUID userId, OrderSearchRequest request,
            Pageable pageable) {
        Specification<Order> spec = buildSpec(request, userId);
        Page<Order> page = orderRepository.findAll(spec, pageable);
        Page<OrderResponse> dtoPage = page.map(this::mapToOrderResponse);

        ResponseDto.PagedResponse<OrderResponse> pagedResponse = ResponseDto.PagedResponse.<OrderResponse>builder()
                .content(dtoPage.getContent())
                .page(dtoPage.getNumber())
                .size(dtoPage.getSize())
                .totalElements(dtoPage.getTotalElements())

                .totalPages(dtoPage.getTotalPages())
                .last(dtoPage.isLast())
                .build();
        return ApiResponse.success(pagedResponse);
    }

    // =====================================
    // GET /admin/orders
    // =====================================
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<OrderResponse>> getAdminOrders(AdminOrderSearchRequest request,
            Pageable pageable) {
        Specification<Order> spec = (root, q, cb) -> cb.conjunction();
        if (request.getUserId() != null)
            spec = spec.and((root, q, cb) -> cb.equal(root.get("user").get("id"), request.getUserId()));
        Page<Order> page = orderRepository.findAll(spec, pageable);
        Page<OrderResponse> dtoPage = page.map(this::mapToOrderResponse);

        ResponseDto.PagedResponse<OrderResponse> pagedResponse = ResponseDto.PagedResponse.<OrderResponse>builder()
                .content(dtoPage.getContent())
                .page(dtoPage.getNumber())
                .size(dtoPage.getSize())
                .totalElements(dtoPage.getTotalElements())
                .totalPages(dtoPage.getTotalPages())

                .last(dtoPage.isLast())
                .build();
        return ApiResponse.success(pagedResponse);
    }

    // =====================================
    // PUT /admin/orders/{id}/accept
    // =====================================
    @Transactional
    public ApiResponse<OrderResponse> acceptOrder(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (order.getStatus() != OrderStatus.PENDING)
            throw new AppException(ErrorCode.BAD_REQUEST);

        order.setStatus(OrderStatus.PROCESSING);
        order = orderRepository.save(order);

        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", order.getUser().getFullName());
            emailData.put("orderId", order.getId());
            emailData.put("totalAmount", order.getTotalAmount());
            emailData.put("orderDate", order.getOrderDate());
            emailData.put("shippingAddress", order.getAddress());
            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                    order.getUser().getEmail(),
                    SendEmailType.ORDER_SUCCESS,
                    emailData));
        } catch (Exception e) {
            log.error("Failed to send order cancellation email for order: {}", id, e);
        }
        return ApiResponse.success(mapToOrderResponse(order));
    }

    // =====================================
    // PUT /admin/orders/{id}/cancel
    // =====================================
    @Transactional
    public ApiResponse<OrderResponse> cancelOrder(UUID id, CancelOrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED)
            throw new AppException(ErrorCode.BAD_REQUEST);
        order.setStatus(OrderStatus.CANCELLED);
        order = orderRepository.save(order);

        if (order.getPaymentMethod().getMethodName() != null &&
                order.getPaymentMethod().getMethodName().equalsIgnoreCase("Wallet")) {
            WalletTransaction refund = WalletTransaction.builder()
                    .wallet(order.getUser().getWallet())
                    .transactionType(TransactionType.REFUND)
                    .transactionStatus(TransactionStatus.COMPLETED)

                    .amount(order.getTotalAmount())
                    .order(order)
                    .description("Refund for cancelled order " + id + ": " + request.getReason())
                    .build();
            txnRepository.save(refund);

            order.getUser().getWallet().setBalance(
                    order.getUser().getWallet().getBalance().add(order.getTotalAmount()));
            walletRepository.save(order.getUser().getWallet());

            evictWalletCache(order.getUser().getId());
        }

        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", order.getUser().getFullName());
            emailData.put("orderId", order.getId());
            emailData.put("reason", request.getReason());
            emailData.put("refundAmount", order.getTotalAmount());
            emailData.put("cancelledDate", LocalDateTime.now());
            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                    order.getUser().getEmail(),
                    SendEmailType.ORDER_CANCELLED,
                    emailData));
        } catch (Exception e) {
            log.error("Failed to send order cancellation email for order: {}", id, e);
        }
        return ApiResponse.success(mapToOrderResponse(order));
    }

    // =====================================
    // PUT /admin/orders/{id}/ship
    // =====================================
    @Transactional
    public ApiResponse<OrderResponse> shipOrder(UUID id, ShipOrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (order.getStatus() != OrderStatus.PROCESSING)
            throw new AppException(ErrorCode.BAD_REQUEST);

        order.setStatus(OrderStatus.SHIPPED);
        order.setTrackingNumber(request.getTrackingNumber());
        order.setShippedDate(LocalDateTime.now());
        order.setEstimatedDeliveryDate(request.getEstimatedDeliveryDate());
        order = orderRepository.save(order);

        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", order.getUser().getFullName());
            emailData.put("orderId", order.getId());
            emailData.put("trackingNumber", order.getTrackingNumber());
            emailData.put("estimatedDeliveryDate", order.getEstimatedDeliveryDate());
            emailData.put("shippedDate", order.getShippedDate());
            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                    order.getUser().getEmail(),
                    SendEmailType.ORDER_SHIPPED,
                    emailData));
        } catch (Exception e) {
            log.error("Failed to send shipping notification email for order: {}", id, e);
        }
        return ApiResponse.success(mapToOrderResponse(order));
    }

    // =====================================
    // PUT /orders/{id}/track
    // =====================================
    @Transactional
    public ApiResponse<OrderResponse> updateLocation(UUID id, UpdateOrderLocationRequest request, UUID userId) {
        Order order = orderRepository.findById(id)
                .filter(o -> o.getUser().getId().equals(userId) || isAdmin(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (order.getStatus() != OrderStatus.SHIPPED)
            throw new AppException(ErrorCode.BAD_REQUEST);

        order.setLatitude(request.getLatitude());
        order.setLongitude(request.getLongitude());
        order = orderRepository.save(order);

        return ApiResponse.success(mapToOrderResponse(order));
    }

    // =====================================
    // PUT /admin/orders/{id}/deliver
    // (Giả định rằng API này được gọi bởi admin hoặc hệ thống giao vận)
    // =====================================
    @Transactional
    public ApiResponse<OrderResponse> deliverOrder(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        if (order.getStatus() != OrderStatus.SHIPPED) {
            log.warn("Attempt to deliver order {} failed. Status was {} (required SHIPPED).", id, order.getStatus());
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        order.setStatus(OrderStatus.DELIVERED);
        order = orderRepository.save(order);

        try {
            Map<String, Object> emailData = new HashMap<>();
            emailData.put("userName", order.getUser().getFullName());
            emailData.put("orderId", order.getId());
            emailData.put("deliveredDate", LocalDateTime.now()); // Dùng ngày hiện tại

            notificationProducer.sendNotification(new NotificationProducer.EmailMessage(
                    order.getUser().getEmail(),
                    SendEmailType.ORDER_DELIVERED,
                    emailData));

            log.info("Order {} marked as DELIVERED.", id);

        } catch (Exception e) {
            log.error("Failed to send order delivery notification email for order: {}", id, e);
        }

        return ApiResponse.success(mapToOrderResponse(order));
    }

    // =====================================
    // PRIVATE HELPERS
    // =====================================
    private OrderResponse mapToOrderResponse(Order order) {
        return ResponseDto.OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .addressId(order.getAddress().getId())

                .paymentMethodId(order.getPaymentMethod().getId())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .status(order.getStatus())
                .orderDate(order.getOrderDate())
                .dueDate(order.getDueDate())
                .shippedDate(order.getShippedDate())

                .trackingNumber(order.getTrackingNumber())
                .estimatedDeliveryDate(order.getEstimatedDeliveryDate())
                .latitude(order.getLatitude())
                .longitude(order.getLongitude())
                .orderDetails(orderDetailRepository.findByOrderId(order.getId())

                        .stream().map(this::mapToDetailResponse).collect(Collectors.toList()))
                .build();
    }

    private OrderDetailResponse mapToDetailResponse(OrderDetail detail) {
        return ResponseDto.OrderDetailResponse.builder()
                .id(detail.getId())
                .productVariantId(detail.getProductVariant().getId())
                .productName(detail.getProductVariant().getProduct().getName())
                .quantity(detail.getQuantity())
                .priceEach(detail.getPriceEach())

                .review(detail.getReview() != null ? mapToReviewResponse(detail.getReview()) : null)
                .build();
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        if (review == null)
            return null;
        return ResponseDto.ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .attachmentUrls(review.getAttachments() == null ? null
                        : review.getAttachments().stream()
                                .map(ReviewAttachment::getAttachmentUrl).collect(Collectors.toSet()))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private BigDecimal calculateShippingFee(Address address) {
        return BigDecimal.valueOf(5.00);
    }

    private boolean isAdmin(UUID userId) {
        return accountRepository.findById(userId)
                .map(u -> u.getRole() == UserRole.ADMIN)
                .orElse(false);
    }

    /**
     * Xóa cache của các product sau khi đặt hàng
     * Vì quantityInStock và quantitySales đã thay đổi
     */
    private void evictProductCacheAfterOrder(java.util.Set<UUID> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return;
        }

        log.info("Evicting cache for {} products after order creation", productIds.size());

        for (UUID productId : productIds) {
            redisService.deleteFromHash(RedisData.PRODUCT_DATA, productId.toString());
            log.debug("Evicted cache for product: {}", productId);
        }

        redisService.deleteKeysByPattern("products:*");

        log.info("Product cache evicted successfully");
    }

    // =====================================
    // WALLET CACHE EVICTION
    // =====================================
    private void evictWalletCache(UUID userId) {
        log.info("Evicting wallet caches for user {}", userId);
        redisService.deleteKey("wallet:" + userId.toString());
        redisService.deleteKeysByPattern("wallet:txns:" + userId.toString() + ":*");
        log.info("Wallet cache evicted successfully for user {}", userId);
    }

    // =====================================
    // SPECIFICATION BUILDER (CLEAN VERSION)
    // =====================================
    private Specification<Order> buildSpec(OrderSearchRequest request, UUID userId) {
        Specification<Order> spec = (root, q, cb) -> cb.equal(root.get("user").get("id"), userId);
        if (request.getStatus() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), request.getStatus()));
        }
        if (request.getFromDate() != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("orderDate"),
                    request.getFromDate().atStartOfDay()));
        }
        if (request.getToDate() != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("orderDate"),
                    request.getToDate().atTime(LocalTime.MAX)));
        }
        return spec;
    }
}