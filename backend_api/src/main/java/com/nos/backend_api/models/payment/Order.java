package com.nos.backend_api.models.payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import com.nos.backend_api.DTO.data.enums.OrderStatus;
import com.nos.backend_api.models.AbstractEntity;
import com.nos.backend_api.models.user_info.Account;
import com.nos.backend_api.models.user_info.Address;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "orders", indexes = {
        @jakarta.persistence.Index(name = "idx_orders_user_id", columnList = "user_id"),
        @jakarta.persistence.Index(name = "idx_orders_status", columnList = "status"),
        @jakarta.persistence.Index(name = "idx_orders_date", columnList = "order_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order extends AbstractEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_orders_users", foreignKeyDefinition = "FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE RESTRICT"))
    private Account user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", nullable = false, foreignKey = @ForeignKey(name = "fk_orders_addresses", foreignKeyDefinition = "FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT"))
    private Address address;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_method_id", nullable = false, foreignKey = @ForeignKey(name = "fk_orders_payment_methods", foreignKeyDefinition = "FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)"))
    private PaymentMethod paymentMethod;

    @NotNull
    @Column(name = "total_amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "shipping_fee", precision = 19, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.PENDING; // Enum: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED,
                                                      // REFUNDED

    @Builder.Default
    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate = LocalDateTime.now();

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "shipped_date")
    private LocalDateTime shippedDate;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "estimated_delivery_date")
    private LocalDateTime estimatedDeliveryDate;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<OrderDetail> orderDetails;
}