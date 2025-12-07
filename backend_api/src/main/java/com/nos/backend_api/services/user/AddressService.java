package com.nos.backend_api.services.user;

import java.util.List;
import java.util.Objects; 
import java.util.Set; 
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.RedisTemplate; 
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.request.RequestDto.CreateAddressRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateAddressRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.AddressResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.user_info.Account;
import com.nos.backend_api.models.user_info.Address;
import com.nos.backend_api.repositories.AccountRepository;
import com.nos.backend_api.repositories.AddressRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; 

@Service
@RequiredArgsConstructor
@Slf4j 
public class AddressService {
    private final AddressRepository addressRepository;
    private final AccountRepository accountRepository;
    private final RedisTemplate<String, Object> redisTemplate; 

    
    private static final String ADDRESS_IDS_PREFIX = "address:ids:";
    private static final String ADDRESS_DATA_PREFIX = "address:data:";

    private String getUserIdsKey(UUID userId) { return ADDRESS_IDS_PREFIX + userId.toString(); }
    private String getUserDataKey(UUID userId) { return ADDRESS_DATA_PREFIX + userId.toString(); }

    // POST /addresses
    @Transactional
    public ApiResponse<AddressResponse> createAddress(UUID userId, CreateAddressRequest request) {
        Account user = accountRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        
        Address address = Address.builder()
                .user(user)
                .recipientFullName(request.getRecipientFullName())
                .recipientPhone(request.getRecipientPhone())
                .district(request.getDistrict())
                .city(request.getCity())
                .country(request.getCountry())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .note(request.getNote())
                .isDefault(false)
                .build();

        if (addressRepository.findByUserIdAndIsDefaultTrue(userId).isEmpty()) {
            address.setDefault(true);
        }
        address = addressRepository.save(address);
        AddressResponse dto = mapToAddressResponse(address);
        
        
        redisTemplate.opsForSet().add(getUserIdsKey(userId), dto.getId());
        redisTemplate.opsForHash().put(getUserDataKey(userId), dto.getId().toString(), dto);

        return ApiResponse.success(dto);
    }

    // GET /addresses/{id}
    @Transactional(readOnly = true)
    public ApiResponse<AddressResponse> getAddress(UUID userId, Long id) {
        AddressResponse cached = (AddressResponse) redisTemplate.opsForHash().get(getUserDataKey(userId), id.toString());
        if (cached != null) {
            log.info("Cache hit for address:data:{}:{}", userId, id);
            return ApiResponse.success(cached);
        }

        log.warn("Cache miss for address:data:{}:{}. Running DB query.", userId, id);
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        
        AddressResponse dto = mapToAddressResponse(address);
        redisTemplate.opsForSet().add(getUserIdsKey(userId), dto.getId());
        redisTemplate.opsForHash().put(getUserDataKey(userId), dto.getId().toString(), dto);

        return ApiResponse.success(dto);
    }

    // GET /addresses
    @Transactional(readOnly = true)
    public ApiResponse<List<AddressResponse>> getAllAddresses(UUID userId) {
        String idsKey = getUserIdsKey(userId);
        String dataKey = getUserDataKey(userId);

        Set<Object> ids = redisTemplate.opsForSet().members(idsKey);
        if (ids != null && !ids.isEmpty()) {
            List<AddressResponse> cached = ids.stream()
                    .map(id -> (AddressResponse) redisTemplate.opsForHash().get(dataKey, id.toString()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            if (!cached.isEmpty()) {
                log.info("Cache hit for address list via SET+HASH ({} items) for user {}", cached.size(), userId);
                return ApiResponse.success(cached);
            }
        }
        
        log.warn("Cache miss for address list {}. Running DB query.", idsKey);
        List<Address> addresses = addressRepository.findByUserId(userId);
        List<AddressResponse> dtos = addresses.stream().map(this::mapToAddressResponse).collect(Collectors.toList());

        redisTemplate.delete(idsKey);
        redisTemplate.delete(dataKey);
        if (!dtos.isEmpty()) {
            dtos.forEach(dto -> {
                redisTemplate.opsForSet().add(idsKey, dto.getId());
                redisTemplate.opsForHash().put(dataKey, dto.getId().toString(), dto);
            });
        }
        return ApiResponse.success(dtos);
    }

    // PUT /addresses/{id}
    @Transactional
    public ApiResponse<AddressResponse> updateAddress(UUID userId, Long id, UpdateAddressRequest request) {
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (request.getRecipientFullName() != null) address.setRecipientFullName(request.getRecipientFullName());
        if (request.getRecipientPhone() != null) address.setRecipientPhone(request.getRecipientPhone());
        if (request.getDistrict() != null) address.setDistrict(request.getDistrict());
        if (request.getCity() != null) address.setCity(request.getCity());
        if (request.getCountry() != null) address.setCountry(request.getCountry());
        if (request.getLatitude() != null) address.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) address.setLongitude(request.getLongitude());
        if (request.getNote() != null) address.setNote(request.getNote());
        if (request.getIsDefault() != null && request.getIsDefault()) {
            addressRepository.unsetDefaultByUserIdExcept(userId, id);
            address.setDefault(true);
        }

        address = addressRepository.save(address);
        
        evictAddressCache(userId);
        
        return ApiResponse.success(mapToAddressResponse(address));
    }

    // PUT /addresses/{id}/set-default
    @Transactional
    public ApiResponse<Void> setDefault(UUID userId, Long id) {
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        addressRepository.unsetDefaultByUserIdExcept(userId, id);
        address.setDefault(true);
        addressRepository.save(address);

        evictAddressCache(userId);
        return ApiResponse.success(null, "Default set");
    }

    // DELETE /addresses/{id}
    @Transactional
    public ApiResponse<Void> deleteAddress(UUID userId, Long id) {
        Address address = addressRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND));
        if (address.isDefault()) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }
        addressRepository.delete(address);

        // Evict cache
        evictAddressCache(userId);
        return ApiResponse.success(null, "Address deleted");
    }

    private AddressResponse mapToAddressResponse(Address address) {
        return ResponseDto.AddressResponse.builder()
                .id(address.getId())
                .recipientFullName(address.getRecipientFullName())
                .recipientPhone(address.getRecipientPhone())
                .district(address.getDistrict())
                .city(address.getCity())
                .country(address.getCountry())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .note(address.getNote())
                .isDefault(address.isDefault())
                .build();
    }

    
    private void evictAddressCache(UUID userId) {
        log.info("Evicting address cache for user {}", userId);
        redisTemplate.delete(getUserIdsKey(userId));
        redisTemplate.delete(getUserDataKey(userId));
    }
}