package com.nos.backend_api.repositories;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.product.ReviewAttachment;

@Repository
public interface ReviewAttachmentRepository extends JpaRepository<ReviewAttachment, Long> {
    List<ReviewAttachment> findByReviewId(Long reviewId);
}