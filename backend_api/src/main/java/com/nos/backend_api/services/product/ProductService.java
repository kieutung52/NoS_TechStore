package com.nos.backend_api.services.product;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.multipart.MultipartFile;

import com.nos.backend_api.DTO.data.redis_cache.RedisData;
import com.nos.backend_api.DTO.request.RequestDto.CreateProductRequest;
import com.nos.backend_api.DTO.request.RequestDto.CreateVariantRequest;
import com.nos.backend_api.DTO.request.RequestDto.ImageActionRequest;
import com.nos.backend_api.DTO.request.RequestDto.ProductSearchRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateProductRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateVariantRequest;
import com.nos.backend_api.DTO.request.RequestDto.UploadImageRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.ProductImageResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ProductResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ProductVariantResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.product.Brand;
import com.nos.backend_api.models.product.Category;
import com.nos.backend_api.models.product.Product;
import com.nos.backend_api.models.product.ProductImage;
import com.nos.backend_api.models.product.ProductVariant;
import com.nos.backend_api.models.product.Review;
import com.nos.backend_api.models.product.ReviewAttachment;

import com.nos.backend_api.repositories.BrandRepository;
import com.nos.backend_api.repositories.CategoryRepository;
import com.nos.backend_api.repositories.ProductImageRepository;
import com.nos.backend_api.repositories.ProductRepository;
import com.nos.backend_api.repositories.ProductVariantRepository;
import com.nos.backend_api.repositories.ReviewRepository;
import com.nos.backend_api.services._system.CloudinaryService;
import com.nos.backend_api.services._system.RedisService;

import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;
    private final BrandRepository brandRepository;
    private final CloudinaryService cloudinaryService;
    private final RedisService redisService;

    // GET /products (Logic K-V cache cho phân trang giữ nguyên)
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<ProductResponse>> getProducts(ProductSearchRequest request,
            Pageable pageable) {

        Sort effectiveSort;
        boolean isUnsorted = !pageable.getSort().isSorted();

        boolean hasInvalidSort = pageable.getSort().stream()
                .anyMatch(
                        o -> o.getProperty().equalsIgnoreCase("price") || o.getProperty().equalsIgnoreCase("default"));
        if (isUnsorted || hasInvalidSort) {
            if (hasInvalidSort) {
                log.warn(
                        "Unsupported sort by 'price' or 'default' requested. Falling back to default sort (name,asc).");
            }
            effectiveSort = Sort.by("name").ascending();
        } else {
            List<Sort.Order> supportedOrders = pageable.getSort().stream()
                    .filter(order -> !order.getProperty().equalsIgnoreCase("price")
                            && !order.getProperty().equalsIgnoreCase("default"))
                    .collect(Collectors.toList());
            effectiveSort = Sort.by(supportedOrders);
        }

        Pageable effectivePageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                effectiveSort);

        String cacheKey = buildProductCacheKey(request, effectivePageable);

        @SuppressWarnings("unchecked")
        ResponseDto.PagedResponse<ProductResponse> cached = (ResponseDto.PagedResponse<ProductResponse>) redisService
                .getValue(cacheKey);
        if (cached != null) {
            log.info("Cache hit for {}", cacheKey);
            return ApiResponse.success(cached);
        }

        log.warn("Cache miss for {}. Running DB query.", cacheKey);
        Specification<Product> spec = (root, q, cb) -> cb.equal(root.get("isPublished"), true);
        if (request.getSearch() != null) {
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("name")),
                    "%" + request.getSearch().toLowerCase() + "%"));
        }
        if (request.getCategoryId() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("category").get("id"), request.getCategoryId()));
        }
        if (request.getBrandId() != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("brand").get("id"), request.getBrandId()));
        }
        if (request.getMinPrice() != null) {
            spec = spec.and((root, q, cb) -> {
                Subquery<BigDecimal> sub = q.subquery(BigDecimal.class);
                Root<ProductVariant> var = sub.from(ProductVariant.class);
                sub.select(cb.least(var.get("price").as(BigDecimal.class)))
                        .where(cb.equal(var.get("product"), root));
                return cb.greaterThanOrEqualTo(sub, request.getMinPrice());
            });
        }
        if (request.getMaxPrice() != null) {
            spec = spec.and((root, q, cb) -> {
                Subquery<BigDecimal> sub = q.subquery(BigDecimal.class);
                Root<ProductVariant> var = sub.from(ProductVariant.class);
                sub.select(cb.greatest(var.get("price").as(BigDecimal.class)))
                        .where(cb.equal(var.get("product"), root));
                return cb.lessThanOrEqualTo(sub, request.getMaxPrice());
            });
        }

        Page<Product> page = productRepository.findAll(spec, effectivePageable);
        Page<ProductResponse> dtoPage = page.map(this::mapToProductResponse);
        ResponseDto.PagedResponse<ProductResponse> pagedResponse = ResponseDto.PagedResponse.<ProductResponse>builder()
                .content(dtoPage.getContent())
                .page(dtoPage.getNumber())
                .size(dtoPage.getSize())
                .totalElements(dtoPage.getTotalElements())
                .totalPages(dtoPage.getTotalPages())

                .last(dtoPage.isLast())
                .build();
        redisService.setValue(cacheKey, pagedResponse, 2, java.util.concurrent.TimeUnit.DAYS);
        return ApiResponse.success(pagedResponse);
    }

    // GET /products/{id} (SỬ DỤNG HASH CACHE)
    @Transactional(readOnly = true)
    public ApiResponse<ProductResponse> getProduct(UUID id) {
        ProductResponse cached = (ProductResponse) redisService.getFromHash(RedisData.PRODUCT_DATA, id.toString());
        if (cached != null) {
            log.info("Cache HIT for product {}", id);
            return ApiResponse.success(cached);
        }

        log.info("Cache MISS for product {} → Query DB", id);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));

        ProductResponse dto = mapToProductResponse(product);

        redisService.addToSet(RedisData.PRODUCT_IDS, id.toString());
        redisService.saveToHash(RedisData.PRODUCT_DATA, id.toString(), dto);

        return ApiResponse.success(dto);
    }

    // POST /products
    @Transactional
    public ApiResponse<ProductResponse> createProduct(CreateProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        Product product = Product.builder()
                .category(category)
                .brand(brand)
                .name(request.getName())
                .description(request.getDescription())
                .quantityInStock(0)
                .quantitySales(0)

                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .build();
        product = productRepository.save(product);

        ProductResponse dto = mapToProductResponse(product);
        redisService.addToSet(RedisData.PRODUCT_IDS, product.getId().toString());
        redisService.saveToHash(RedisData.PRODUCT_DATA, product.getId().toString(), dto);
        evictProductCache(product.getId());
        return ApiResponse.success(dto);
    }

    // PUT /products/{id}
    @Transactional
    public ApiResponse<ProductResponse> updateProduct(UUID id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (request.getName() != null)
            product.setName(request.getName());
        if (request.getDescription() != null)
            product.setDescription(request.getDescription());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
            product.setCategory(category);
        }
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
            product.setBrand(brand);
        }
        if (request.getIsPublished() != null)
            product.setPublished(request.getIsPublished());
        if (request.getQuantityInStock() != null)
            product.setQuantityInStock(request.getQuantityInStock());
        product = productRepository.save(product);
        ProductResponse dto = mapToProductResponse(product);
        redisService.saveToHash(RedisData.PRODUCT_DATA, id.toString(), dto);
        evictProductCache(id);
        return ApiResponse.success(mapToProductResponse(product));
    }

    // DELETE /products/{id}
    @Transactional
    public ApiResponse<Void> deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        product.getVariants().forEach(v -> v.getImages().forEach(img -> {
            cloudinaryService.delete(img.getCloudinaryPublicId());
        }));
        productRepository.deleteById(id);

        redisService.removeFromSet(RedisData.PRODUCT_IDS, id.toString());
        redisService.deleteFromHash(RedisData.PRODUCT_DATA, id.toString());
        evictProductCache(id);
        return ApiResponse.success(null, "Product deleted");
    }

    // POST /products/{id}/variants
    @Transactional
    public ApiResponse<ProductVariantResponse> createVariant(UUID id, CreateVariantRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .sku(request.getSku())
                .price(request.getPrice())
                .attributes(request.getAttributes())
                .build();
        variant = variantRepository.save(variant);

        evictProductCacheOnly(id);
        return ApiResponse.success(mapToVariantResponse(variant));
    }

    // PUT /products/{id}/variants/{variantId}
    @Transactional
    public ApiResponse<ProductVariantResponse> updateVariant(UUID id, UUID variantId, UpdateVariantRequest request) {
        ProductVariant variant = variantRepository.findById(variantId)
                .filter(v -> v.getProduct().getId().equals(id))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (request.getSku() != null)
            variant.setSku(request.getSku());
        if (request.getPrice() != null)
            variant.setPrice(request.getPrice());
        if (request.getAttributes() != null)
            variant.setAttributes(request.getAttributes());
        variant = variantRepository.save(variant);

        evictProductCacheOnly(id);
        return ApiResponse.success(mapToVariantResponse(variant));
    }

    // DELETE /products/{id}/variants/{variantId}
    @Transactional
    public ApiResponse<Void> deleteVariant(UUID id, UUID variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .filter(v -> v.getProduct().getId().equals(id))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        variant.getImages().forEach(img -> cloudinaryService.delete(img.getCloudinaryPublicId()));
        variantRepository.delete(variant);

        evictProductCacheOnly(id);
        return ApiResponse.success(null, "Variant deleted");
    }

    // POST /products/{id}/images
    @Transactional
    @SuppressWarnings("unused")
    public ApiResponse<ProductImageResponse> uploadImage(UUID id, UploadImageRequest request, MultipartFile file) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        ProductVariant variant = variantRepository.findById(request.getTargetId())
                .filter(v -> v.getProduct().getId().equals(id))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        String folder = "products/" + id + "/variants/" + request.getTargetId();
        Map result = cloudinaryService.upload(file, folder);
        ProductImage image = ProductImage.builder()
                .productVariant(variant)
                .imageUrl((String) result.get("secure_url"))
                .cloudinaryPublicId((String) result.get("public_id"))
                .isThumbnail(request.getIsThumbnail() != null ? request.getIsThumbnail() : false)
                .altText(request.getAltText())

                .build();
        image = imageRepository.save(image);

        evictProductCacheOnly(id);
        return ApiResponse.success(mapToImageResponse(image));
    }

    // PUT /products/{id}/images/{imageId}
    @Transactional
    public ApiResponse<ProductImageResponse> replaceImage(UUID id, Long imageId, ImageActionRequest request,
            MultipartFile file) {
        ProductImage image = imageRepository.findById(imageId)
                .filter(img -> img.getProductVariant().getProduct().getId().equals(id))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        String folder = "products/" + id + "/variants/" + image.getProductVariant().getId();
        Map result = cloudinaryService.replace(file, image.getCloudinaryPublicId(), folder);
        image.setImageUrl((String) result.get("secure_url"));
        image.setAltText(request.getAltText());
        image.setThumbnail(request.getIsThumbnail() != null ? request.getIsThumbnail() : image.isThumbnail());
        image = imageRepository.save(image);

        evictProductCacheOnly(id);
        return ApiResponse.success(mapToImageResponse(image));
    }

    // PUT /products/{id}/images/{imageId}/thumbnail
    @Transactional
    public ApiResponse<Void> setThumbnail(UUID id, Long imageId) {
        ProductImage image = imageRepository.findById(imageId)
                .filter(img -> img.getProductVariant().getProduct().getId().equals(id))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        imageRepository.unsetThumbnailByVariantId(image.getProductVariant().getId());
        image.setThumbnail(true);
        imageRepository.save(image);

        evictProductCacheOnly(id);
        return ApiResponse.success(null, "Thumbnail set");
    }

    // DELETE /products/{id}/images/{imageId}
    @Transactional
    public ApiResponse<Void> deleteImage(UUID id, Long imageId) {
        ProductImage image = imageRepository.findById(imageId)
                .filter(img -> img.getProductVariant().getProduct().getId().equals(id))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        cloudinaryService.delete(image.getCloudinaryPublicId());
        imageRepository.delete(image);
        evictProductCacheOnly(id);
        return ApiResponse.success(null, "Image deleted");
    }

    private ProductResponse mapToProductResponse(Product product) {
        Double rating = productRepository.getAverageRatingByProductId(product.getId());

        return ResponseDto.ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .categoryId(product.getCategory().getId())
                .brandId(product.getBrand().getId())
                .quantityInStock(product.getQuantityInStock())
                .quantitySales(product.getQuantitySales())
                .isPublished(product.isPublished())
                .averageRating(rating)

                .variants(product.getVariants() == null ? new ArrayList<>()
                        : product.getVariants().stream()
                                .sorted(Comparator.comparing(ProductVariant::getPrice))
                                .map(this::mapToVariantResponse)
                                .collect(Collectors.toList()))

                .recentReviews(reviewRepository.findByProductId(product.getId(), PageRequest.of(0, 5))
                        .getContent()
                        .stream()
                        .map(this::mapToReviewResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private ProductVariantResponse mapToVariantResponse(ProductVariant variant) {
        return ResponseDto.ProductVariantResponse.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .price(variant.getPrice())
                .attributes(variant.getAttributes())
                .images(variant.getImages() == null
                        ? null
                        : variant.getImages().stream()
                                .map(this::mapToImageResponse)
                                .collect(Collectors.toList()))
                .stock(variant.getProduct().getQuantityInStock())
                .build();
    }

    private ProductImageResponse mapToImageResponse(ProductImage image) {
        return ResponseDto.ProductImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl() == null ? null : image.getImageUrl())
                .cloudinaryPublicId(image.getCloudinaryPublicId() == null ? null : image.getCloudinaryPublicId())
                .isThumbnail(image.isThumbnail())

                .altText(image.getAltText())
                .build();
    }

    private ResponseDto.ReviewResponse mapToReviewResponse(Review review) {
        if (review == null)
            return null;
        return ResponseDto.ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .attachmentUrls(review.getAttachments() == null ? null
                        : review.getAttachments().stream().map(ReviewAttachment::getAttachmentUrl)
                                .collect(Collectors.toSet()))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private void evictProductCacheOnly(UUID productId) {
        redisService.deleteKeysByPattern("products:*");
        if (productId != null) {
            redisService.deleteFromHash(RedisData.PRODUCT_DATA, productId.toString());
        }

        log.info("Evicted product cache for product {}", productId);
    }

    private void evictProductCache(UUID productId) {
        evictProductCacheOnly(productId);

        log.info("Evicting categories and brands cache due to product change");

        redisService.deleteKey("categories:all");
        redisService.deleteKey(RedisData.CATEGORY_IDS);
        redisService.deleteKey(RedisData.CATEGORY_DATA);

        redisService.deleteKey("brands:all");
        redisService.deleteKey(RedisData.BRAND_IDS);
        redisService.deleteKey(RedisData.BRAND_DATA);
    }

    private String buildProductCacheKey(ProductSearchRequest request, Pageable pageable) {
        String normalizedSearch = request.getSearch() != null ? request.getSearch().trim().toLowerCase() : "null";
        String searchHash = DigestUtils.md5DigestAsHex(normalizedSearch.getBytes());

        String sortStr = "unsorted";
        if (pageable.getSort().isSorted()) {
            sortStr = pageable.getSort().stream()
                    .map(order -> order.getProperty() + ":" + order.getDirection())
                    .collect(Collectors.joining(","));
        }
        if (sortStr.isEmpty())
            sortStr = "unsorted";
        return String.format("products:search:%s:cat:%s:brand:%s:min:%s:max:%s:page:%d:size:%d:sort:%s",
                searchHash, request.getCategoryId(), request.getBrandId(),
                request.getMinPrice(), request.getMaxPrice(),
                pageable.getPageNumber(), pageable.getPageSize(), sortStr);
    }

}