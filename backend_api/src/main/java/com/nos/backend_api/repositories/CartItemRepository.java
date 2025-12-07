package com.nos.backend_api.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.models.shopping_cart.CartItem;
import com.nos.backend_api.models.shopping_cart.CartItemId;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, CartItemId> {
    Optional<CartItem> findByCartIdAndProductVariantId(UUID cartId, UUID productVariantId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM CartItem ci WHERE ci.cart.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    void deleteAllByCartId(UUID id);

    List<CartItem> findAllByCartId(UUID id);
}