package com.nos.backend_api.repositories;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.product.Product;

import jakarta.persistence.QueryHint;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Page<Product> findByCategoryIdAndIsPublished(Integer categoryId, boolean isPublished, Pageable pageable);
    Page<Product> findByBrandIdAndIsPublished(Integer brandId, boolean isPublished, Pageable pageable);
    Page<Product> findByNameContainingIgnoreCaseAndIsPublished(String name, boolean isPublished, Pageable pageable);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") UUID productId);
    
    @Query(value = "SELECT p.* FROM products p JOIN product_variants pv ON p.id = pv.product_id WHERE pv.attributes @> :attributesJson AND p.is_published = true", nativeQuery = true)
    Page<Product> findByAttributes(@Param("attributesJson") String attributesJson, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Product p " +
       "LEFT JOIN FETCH p.variants v " +
       "LEFT JOIN FETCH p.category c " +
       "LEFT JOIN FETCH p.brand b " +
       "LEFT JOIN FETCH p.reviews r " +
       "WHERE (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
       "AND (:categoryId IS NULL OR c.id = :categoryId OR p.category IN (SELECT cc FROM Category cc WHERE cc.parentCategory.id = :categoryId)) " +  // Handle tree
       "AND (:brandId IS NULL OR b.id = :brandId) " +
       "AND (:minPrice IS NULL OR (SELECT MIN(vv.price) FROM ProductVariant vv WHERE vv.product.id = p.id) >= :minPrice) " +
       "AND (:maxPrice IS NULL OR (SELECT MAX(vv.price) FROM ProductVariant vv WHERE vv.product.id = p.id) <= :maxPrice) " +
       "AND (:attributesRam IS NULL OR EXISTS (SELECT 1 FROM ProductVariant vv WHERE vv.product.id = p.id AND FUNCTION('JSON_EXTRACT', vv.attributes, '$.ram') = :attributesRam)) " +  // Example for attributes (adjust for JSON)
       "AND p.isPublished = true")
    @QueryHints({@QueryHint(name = "org.hibernate.cacheable", value = "true")})
    Page<Product> findProductsWithFilters(
        @Param("search") String search,
        @Param("categoryId") Integer categoryId,
        @Param("brandId") Integer brandId,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("attributesRam") String attributesRam,
        Pageable pageable
    );

    @Query("SELECT DISTINCT p FROM Product p " +
       "LEFT JOIN p.variants v " +
       "GROUP BY p.id " +
       "HAVING MIN(v.price) IS NOT NULL " +
       "ORDER BY MIN(v.price) ASC")
    Page<Product> findAllSortedByMinPrice(Pageable pageable);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants v LEFT JOIN FETCH v.images WHERE p.id = :id")
    Optional<Product> findByIdWithDetails(@Param("id") UUID id);
}