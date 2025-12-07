package com.nos.backend_api.models.shopping_cart;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CartItemId implements Serializable {
    @Column(name = "cart_id")
    private UUID cartId;

    @Column(name = "product_variant_id")
    private UUID productVariantId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CartItemId that = (CartItemId) o;
        return Objects.equals(cartId, that.cartId) && Objects.equals(productVariantId, that.productVariantId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(cartId, productVariantId);
    }
}
