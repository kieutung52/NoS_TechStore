package com.nos.backend_api.services.product;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.data.redis_cache.RedisData;
import com.nos.backend_api.DTO.request.RequestDto.CreateCategoryRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateCategoryRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.CategoryResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ProductSummaryResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.product.Category;
import com.nos.backend_api.models.product.Product;
import com.nos.backend_api.repositories.CategoryRepository;
import com.nos.backend_api.repositories.ProductRepository;
import com.nos.backend_api.repositories.ProductVariantRepository;
import com.nos.backend_api.services._system.RedisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final RedisService redisService;

    // GET /categories
    @Transactional(readOnly = true)
    public ApiResponse<List<CategoryResponse>> getAllCategories() {
        Set<Object> ids = redisService.getSetMembers(RedisData.CATEGORY_IDS);
        if (ids != null && !ids.isEmpty()) {
            List<CategoryResponse> cached = ids.stream()
                    .map(id -> (CategoryResponse) redisService.getFromHash(RedisData.CATEGORY_DATA, id.toString()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            if (!cached.isEmpty()) {
                log.info("Cache hit for categories list via SET+HASH ({} items)", cached.size());
                return ApiResponse.success(cached);
            }
        }

        List<Category> roots = categoryRepository.findRootWithChildren();
        List<CategoryResponse> dtos = roots.stream().map(this::buildTreeResponse).collect(Collectors.toList());

        redisService.deleteKey(RedisData.CATEGORY_IDS);
        redisService.deleteKey(RedisData.CATEGORY_DATA); // Xóa cả HASH để đảm bảo
        dtos.forEach(dto -> {
            redisService.addToSet(RedisData.CATEGORY_IDS, dto.getId());
            redisService.saveToHash(RedisData.CATEGORY_DATA, dto.getId().toString(), dto);
        });
        return ApiResponse.success(dtos);
    }

    // GET /categories/{id} (admin)
    @Transactional(readOnly = true)
    public ApiResponse<CategoryResponse> getCategory(Integer id) {
        CategoryResponse cached = (CategoryResponse) redisService.getFromHash(RedisData.CATEGORY_DATA, id.toString());
        if (cached != null) {
            return ApiResponse.success(cached);
        }

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        CategoryResponse dto = mapToCategoryResponse(category);

        redisService.addToSet(RedisData.CATEGORY_IDS, dto.getId());
        redisService.saveToHash(RedisData.CATEGORY_DATA, dto.getId().toString(), dto);

        return ApiResponse.success(dto);
    }

    // PUT /categories/{id} (admin)
    @Transactional
    public ApiResponse<CategoryResponse> updateCategory(Integer id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (request.getName() != null) category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        category = categoryRepository.save(category);

        CategoryResponse dto = mapToCategoryResponse(category);
        redisService.addToSet(RedisData.CATEGORY_IDS, dto.getId());
        redisService.saveToHash(RedisData.CATEGORY_DATA, dto.getId().toString(), dto);

        return ApiResponse.success(dto);
    }

    // DELETE /categories/{id} (admin)
    @Transactional
    public ApiResponse<Void> deleteCategory(Integer id) {
        if (!categoryRepository.existsById(id)) {
            throw new AppException(ErrorCode.NOT_FOUND);
        }
        categoryRepository.deleteById(id);

        redisService.removeFromSet(RedisData.CATEGORY_IDS, id);
        redisService.deleteFromHash(RedisData.CATEGORY_DATA, id.toString());

        return ApiResponse.success(null, "Category deleted");
    }

    // POST /categories (admin)
    @Transactional
    public ApiResponse<CategoryResponse> createCategory(CreateCategoryRequest request) {
        Category parent = request.getParentCategoryId() != null
                ? categoryRepository.findById(request.getParentCategoryId()).orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND))
                : null;
        Category category = Category.builder()
                .parentCategory(parent)
                .name(request.getName())
                .description(request.getDescription())
                .build();
        category = categoryRepository.save(category);
        CategoryResponse dto = mapToCategoryResponse(category);

        redisService.addToSet(RedisData.CATEGORY_IDS, dto.getId());
        redisService.saveToHash(RedisData.CATEGORY_DATA, dto.getId().toString(), dto);

        return ApiResponse.success(dto);
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .parentCategoryId(category.getParentCategory() != null ? category.getParentCategory().getId() : null)
        
                .children(category.getChildrenCategories() != null ? category.getChildrenCategories().stream().map(this::buildTreeResponse).collect(Collectors.toList()) : null)
                .products(category.getProducts() != null ? category.getProducts().stream()
                        .map(this::mapToProductSummaryResponse)
                        .collect(Collectors.toList()) : null)
                
                .build();
    }

    private CategoryResponse buildTreeResponse(Category category) {
        CategoryResponse dto = mapToCategoryResponse(category);
        dto.setChildren(category.getChildrenCategories() != null ? category.getChildrenCategories().stream().map(this::buildTreeResponse).collect(Collectors.toList()) : null);
        return dto;
    }

    private ProductSummaryResponse mapToProductSummaryResponse(Product p) {
        return ProductSummaryResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .price(variantRepository.getMinPriceByProductId(p.getId()))
                .averageRating(productRepository.getAverageRatingByProductId(p.getId()))
          
                .thumbnailUrl(p.getVariants() == null ? null : p.getVariants().stream()
                        .filter(v -> v.getImages() != null)
                        .flatMap(v -> v.getImages().stream())
                        .filter(img -> img.isThumbnail())
        
                        .map(img -> img.getImageUrl())
                        .findFirst().orElse(null))
                .build();
    }
}