package com.nos.backend_api.services.product;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.nos.backend_api.DTO.data.redis_cache.RedisData;
import com.nos.backend_api.DTO.request.RequestDto.CreateBrandRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateBrandRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto.BrandResponse;
import com.nos.backend_api.DTO.response.ResponseDto.ProductSummaryResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.product.Brand;
import com.nos.backend_api.repositories.BrandRepository;
import com.nos.backend_api.repositories.ProductRepository;
import com.nos.backend_api.repositories.ProductVariantRepository;
import com.nos.backend_api.services._system.RedisService;
import com.nos.backend_api.services._system.CloudinaryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrandService {
    private final BrandRepository brandRepository;
    private final CloudinaryService cloudinaryService;
    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final RedisService redisService;

    // GET /brands
    @Transactional(readOnly = true)
    public ApiResponse<List<BrandResponse>> getAllBrands() {
        Set<Object> ids = redisService.getSetMembers(RedisData.BRAND_IDS);
        if (ids != null && !ids.isEmpty()) {
            List<BrandResponse> cached = ids.stream()
                    .map(id -> (BrandResponse) redisService.getFromHash(RedisData.BRAND_DATA, id.toString()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            if (!cached.isEmpty()) {
                log.info("Cache hit for brand list via SET+HASH ({} items)", cached.size());
                return ApiResponse.success(cached);
            }
        }

        List<Brand> brands = brandRepository.findAll();
        List<BrandResponse> dtos = brands.stream().map(this::mapToBrandResponse).collect(Collectors.toList());

        redisService.deleteKey(RedisData.BRAND_IDS);
        if (!dtos.isEmpty()) {
            dtos.forEach(dto -> {
                redisService.addToSet(RedisData.BRAND_IDS, dto.getId());
                redisService.saveToHash(RedisData.BRAND_DATA, dto.getId().toString(), dto);
            });
        }
        return ApiResponse.success(dtos);
    }

    // GET /brands/{id}
    @Transactional(readOnly = true)
    public ApiResponse<BrandResponse> getBrand(Integer id) {
        BrandResponse cached = (BrandResponse) redisService.getFromHash(RedisData.BRAND_DATA, id.toString());
        if (cached != null) {
            return ApiResponse.success(cached);
        }

        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        BrandResponse dto = mapToBrandResponse(brand);

        redisService.addToSet(RedisData.BRAND_IDS, dto.getId());
        redisService.saveToHash(RedisData.BRAND_DATA, dto.getId().toString(), dto);
        return ApiResponse.success(dto);
    }

    // PUT /brands/{id} (admin)
    @Transactional
    public ApiResponse<BrandResponse> updateBrand(Integer id, UpdateBrandRequest request, MultipartFile logoFile) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (request.getName() != null) brand.setName(request.getName());
        if (request.getDescription() != null) brand.setDescription(request.getDescription());
        if (logoFile != null && !logoFile.isEmpty()) {
            String folder = "brands/" + id;
            Map result;
            if (brand.getCloudinaryPublicId() != null) {
                result = cloudinaryService.replace(logoFile, brand.getCloudinaryPublicId(), folder);
            } else {
                result = cloudinaryService.upload(logoFile, folder);
            }
            brand.setLogoUrl((String) result.get("secure_url"));
            brand.setCloudinaryPublicId((String) result.get("public_id"));
        }
        brand = brandRepository.save(brand);
        BrandResponse dto = mapToBrandResponse(brand);
        
        redisService.addToSet(RedisData.BRAND_IDS, dto.getId());
        redisService.saveToHash(RedisData.BRAND_DATA, dto.getId().toString(), dto);
        return ApiResponse.success(dto);
    }

    // DELETE /brands/{id} (admin)
    @Transactional
    public ApiResponse<Void> deleteBrand(Integer id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (brand.getCloudinaryPublicId() != null) {
            cloudinaryService.delete(brand.getCloudinaryPublicId());
        }
        brandRepository.deleteById(id);

        redisService.removeFromSet(RedisData.BRAND_IDS, id);
        redisService.deleteFromHash(RedisData.BRAND_DATA, id.toString());

        return ApiResponse.success(null, "Brand deleted");
    }

    // POST /brands (admin)
    @Transactional
    public ApiResponse<BrandResponse> createBrand(CreateBrandRequest request, MultipartFile logoFile) {
        if (brandRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.EXISTS);
        }
        Brand brand = Brand.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
        if (logoFile != null && !logoFile.isEmpty()) {
            String folder = "brands";
            Map result = cloudinaryService.upload(logoFile, folder);
            brand.setLogoUrl((String) result.get("secure_url"));
            brand.setCloudinaryPublicId((String) result.get("public_id"));
        }
        brand = brandRepository.save(brand);
        BrandResponse dto = mapToBrandResponse(brand);

        redisService.addToSet(RedisData.BRAND_IDS, dto.getId());
        redisService.saveToHash(RedisData.BRAND_DATA, dto.getId().toString(), dto);
        return ApiResponse.success(dto);
    }

    private BrandResponse mapToBrandResponse(Brand brand) {
        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .description(brand.getDescription())
                .logoUrl(brand.getLogoUrl() != null ? brand.getLogoUrl() : null)
           
                .products(brand.getProducts() != null ? brand.getProducts().stream().map(p -> ProductSummaryResponse.builder()
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
                        .build()).collect(Collectors.toList()) : null)
                .build();
    }
}