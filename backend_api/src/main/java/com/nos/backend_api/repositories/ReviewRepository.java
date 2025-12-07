package com.nos.backend_api.repositories;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.product.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByProductId(UUID productId, Pageable pageable);
    boolean existsByOrderDetailId(Long orderDetailId);
    Page<Review> findByUserId(UUID userId, Pageable pageable);
    
    Optional<Review> findByIdAndUserId(Long id, UUID userId);  

    long countByCreatedAtBetweenAndRatingGreaterThanEqual(LocalDateTime start, LocalDateTime end, int rating);
    long countByCreatedAtBetweenAndRatingLessThan(LocalDateTime start, LocalDateTime end, int rating);
}