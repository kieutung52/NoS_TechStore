package com.nos.backend_api.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.shopping_cart.ShoppingCart;

@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, UUID> {
    Optional<ShoppingCart> findByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(ci.quantity), 0) FROM CartItem ci")
    int sumItemsInActiveCarts();
}