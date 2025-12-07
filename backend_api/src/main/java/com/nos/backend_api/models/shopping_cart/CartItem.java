package com.nos.backend_api.models.shopping_cart;

import java.time.LocalDateTime;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import com.nos.backend_api.models.AbstractEntity;
import com.nos.backend_api.models.product.ProductVariant;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem extends AbstractEntity {
    @EmbeddedId
    private CartItemId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("cartId")
    @JoinColumn(name = "cart_id", nullable = false, foreignKey = 
        @ForeignKey(name = "fk_cartitems_shoppingcarts", foreignKeyDefinition = "FOREIGN KEY (cart_id) REFERENCES shopping_carts(id)")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ShoppingCart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("productVariantId")
    @JoinColumn(name = "product_variant_id", nullable = false, foreignKey = 
        @ForeignKey(name = "fk_cartitems_productvariants", foreignKeyDefinition = "FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)")
    )
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ProductVariant productVariant;

    @Builder.Default
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Builder.Default
    @Column(name = "added_at", nullable = false)
    private LocalDateTime addedAt = LocalDateTime.now();
}