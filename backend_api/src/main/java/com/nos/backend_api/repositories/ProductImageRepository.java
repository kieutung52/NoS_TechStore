package com.nos.backend_api.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.models.product.ProductImage;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductVariantId(UUID productVariantId);
    
    @Modifying
    @Transactional
    @Query("UPDATE ProductImage pi SET pi.isThumbnail = false WHERE pi.productVariant.id = :variantId")
    void unsetThumbnailByVariantId(@Param("variantId") UUID variantId);
}