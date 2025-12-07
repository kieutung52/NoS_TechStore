package com.nos.backend_api.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.product.ProductVariant;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    Optional<ProductVariant> findBySku(String sku);
    List<ProductVariant> findByProductId(UUID productId);
    
    @Query("SELECT MIN(pv.price) FROM ProductVariant pv WHERE pv.product.id = :productId")
    java.math.BigDecimal getMinPriceByProductId(@Param("productId") UUID productId);
}