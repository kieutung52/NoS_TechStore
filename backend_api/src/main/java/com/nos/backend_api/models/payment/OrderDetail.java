package com.nos.backend_api.models.payment;

import java.math.BigDecimal;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.nos.backend_api.models.AbstractEntity;
import com.nos.backend_api.models.product.ProductVariant;
import com.nos.backend_api.models.product.Review;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "order_details", indexes = {
        @jakarta.persistence.Index(name = "idx_order_details_order_id", columnList = "order_id"),
        @jakarta.persistence.Index(name = "idx_order_details_variant_id", columnList = "product_variant_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetail extends AbstractEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_details_orders", foreignKeyDefinition = "FOREIGN KEY (order_id) REFERENCES orders(id)"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Order order;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_details_variants", foreignKeyDefinition = "FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT"))
    private ProductVariant productVariant;

    @NotNull
    @Builder.Default
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @NotNull
    @Column(name = "price_each", precision = 19, scale = 2, nullable = false)
    private BigDecimal priceEach;

    @OneToOne(mappedBy = "orderDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Review review;
}