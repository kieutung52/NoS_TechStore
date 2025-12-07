package com.nos.backend_api.services.product;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.nos.backend_api.DTO.data.enums.AttachmentType;
import com.nos.backend_api.DTO.data.redis_cache.RedisData;
import com.nos.backend_api.DTO.request.RequestDto.CreateReviewRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateReviewRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.ReviewResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.product.Review;
import com.nos.backend_api.models.product.ReviewAttachment;
import com.nos.backend_api.repositories.AccountRepository;
import com.nos.backend_api.repositories.OrderDetailRepository;
import com.nos.backend_api.repositories.ProductRepository;
import com.nos.backend_api.repositories.ReviewAttachmentRepository;
import com.nos.backend_api.repositories.ReviewRepository;
import com.nos.backend_api.services._system.CloudinaryService;
import com.nos.backend_api.services._system.RedisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewAttachmentRepository attachmentRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final AccountRepository accountRepository;
    private final ProductRepository productRepository;
    private final CloudinaryService cloudinaryService;
    private final RedisService redisService;

    // GET /reviews/products/{productId}
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<ReviewResponse>> getReviewsByProduct(UUID productId, Pageable pageable) {
        
        String cacheKey = buildReviewCacheKey(productId, pageable);
        @SuppressWarnings("unchecked")
        ResponseDto.PagedResponse<ReviewResponse> cached = (ResponseDto.PagedResponse<ReviewResponse>) redisService.getValue(cacheKey);
        if (cached != null) {
            log.info("Cache hit for {}", cacheKey);
            return ApiResponse.success(cached);
        }

        log.warn("Cache miss for {}. Running DB query.", cacheKey);
        Page<Review> page = reviewRepository.findByProductId(productId, pageable);
        Page<ReviewResponse> dtoPage = page.map(this::mapToReviewResponse);

        ResponseDto.PagedResponse<ReviewResponse> pagedResponse = ResponseDto.PagedResponse.<ReviewResponse>builder()
                .content(dtoPage.getContent())
                .page(dtoPage.getNumber())
                .size(dtoPage.getSize())
                .totalElements(dtoPage.getTotalElements())
            
                .totalPages(dtoPage.getTotalPages())
                .last(dtoPage.isLast())
                .build();
        redisService.setValue(cacheKey, pagedResponse, 1, java.util.concurrent.TimeUnit.HOURS);
        
        return ApiResponse.success(pagedResponse);
    }

    // POST /reviews/products/{productId}
    @Transactional
    public ApiResponse<ReviewResponse> createReview(UUID userId, UUID productId, CreateReviewRequest request, List<MultipartFile> attachments) {
        if (!orderDetailRepository.existsByUserPurchase(userId, productId)) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        Review review = reviewRepository.save(Review.builder()
                .user(accountRepository.findById(userId).orElseThrow())
                .product(productRepository.findById(productId).orElseThrow())
                .rating(request.getRating())
                .comment(request.getComment())
                .build());
        if (attachments != null && !attachments.isEmpty()) {
            attachments.forEach(file -> {
                String folder = "reviews/" + review.getId();
                Map result = cloudinaryService.upload(file, folder);
                AttachmentType type = file.getContentType().startsWith("video") ? AttachmentType.VIDEO : AttachmentType.IMAGE;
                
                ReviewAttachment att = ReviewAttachment.builder()
                        .review(review)
                        .attachmentUrl((String) result.get("secure_url"))
                        .cloudinaryPublicId((String) result.get("public_id"))
                       
                        .attachmentType(type)
                        .build();
                attachmentRepository.save(att);
            });
        }
        
        evictReviewCache(productId);
        return ApiResponse.success(mapToReviewResponse(review));
    }

    // PUT /reviews/{id}
    @Transactional
    public ApiResponse<ReviewResponse> updateReview(UUID userId, Long id, UpdateReviewRequest request) {
        Review review = reviewRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (request.getRating() != null) review.setRating(request.getRating());
        if (request.getComment() != null) review.setComment(request.getComment());
        review = reviewRepository.save(review);
        evictReviewCache(review.getProduct().getId());
        return ApiResponse.success(mapToReviewResponse(review));
    }

    // DELETE /reviews/{id}
    @Transactional
    public ApiResponse<Void> deleteReview(UUID userId, Long id) {
        Review review = reviewRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        review.getAttachments().forEach(att -> cloudinaryService.delete(att.getCloudinaryPublicId()));
        reviewRepository.delete(review);
        evictReviewCache(review.getProduct().getId()); // Sửa
        return ApiResponse.success(null, "Review deleted");
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        return ResponseDto.ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
        
                .comment(review.getComment())
                .attachmentUrls(review.getAttachments() == null ? null : review.getAttachments().stream().map(ReviewAttachment::getAttachmentUrl).collect(Collectors.toSet()))
                .createdAt(review.getCreatedAt())
                .build();
    }


    private String buildReviewCacheKey(UUID productId, Pageable pageable) {
        String sortStr = pageable.getSort().isSorted() ?
            pageable.getSort().stream().map(o -> o.getProperty() + ":" + o.getDirection()).collect(Collectors.joining(","))
            : "default";
        return String.format("reviews:product:%s:page:%d:size:%d:sort:%s",
                productId.toString(),
                pageable.getPageNumber(),
                pageable.getPageSize(),
                sortStr);
    }
    
    private void evictReviewCache(UUID productId) {
        String keyPattern = "reviews:product:" + productId.toString() + ":*";
        redisService.deleteKeysByPattern(keyPattern);
        redisService.deleteKeysByPattern("products:*");
        redisService.deleteFromHash(RedisData.PRODUCT_DATA, productId.toString());
        log.info("Evicting categories and brands cache due to review change");
        redisService.deleteKey("categories:all"); 
        redisService.deleteKey(RedisData.CATEGORY_IDS);
        redisService.deleteKey(RedisData.CATEGORY_DATA);
        
        redisService.deleteKey("brands:all"); 
        redisService.deleteKey(RedisData.BRAND_IDS);
        redisService.deleteKey(RedisData.BRAND_DATA);
    }
}