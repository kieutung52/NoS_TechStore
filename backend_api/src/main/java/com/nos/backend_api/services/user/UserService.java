package com.nos.backend_api.services.user;

import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.data.enums.UserRole;
import com.nos.backend_api.DTO.data.redis_cache.RedisData;
import com.nos.backend_api.DTO.request.RequestDto.CreateUserRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateProfileRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateUserRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.UserResponse;
import com.nos.backend_api.DTO.response.ResponseDto.WalletSummaryResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.user_info.Account;
import com.nos.backend_api.models.user_info.Wallet;
import com.nos.backend_api.repositories.AccountRepository;
import com.nos.backend_api.repositories.WalletRepository;
import com.nos.backend_api.services._system.RedisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; 

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final AccountRepository accountRepository;
    private final WalletRepository walletRepository;
    private final RedisService redisService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final String USERS_PAGE_PREFIX = "users:page:";

    // GET /users/profile
    @Transactional(readOnly = true)
    public ApiResponse<UserResponse> getProfile(UUID userId) {
        UserResponse cached = (UserResponse) redisService.getFromHash(RedisData.USER_DATA, userId.toString());
        if (cached != null) {
            log.info("Cache hit for user:data:{}", userId);
            return ApiResponse.success(cached);
        }

        log.warn("Cache miss for user:data:{}. Running DB query.", userId);
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        UserResponse dto = mapToUserResponse(account);
        redisService.saveToHash(RedisData.USER_DATA, userId.toString(), dto);
        return ApiResponse.success(dto);
    }

    // PUT /users/profile
    @Transactional
    public ApiResponse<UserResponse> updateProfile(UUID userId, UpdateProfileRequest request) {
        Account account = accountRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (request.getFullName() != null) account.setFullName(request.getFullName());
        if (request.getDateOfBirth() != null) account.setDateOfBirth(request.getDateOfBirth());
        account = accountRepository.save(account);
        evictUserCache(userId);
        return ApiResponse.success(mapToUserResponse(account));
    }

    // Admin: GET /users/{id}
    @Transactional(readOnly = true)
    public ApiResponse<UserResponse> getUserById(UUID id) {
        UserResponse cached = (UserResponse) redisService.getFromHash(RedisData.USER_DATA, id.toString());
        if (cached != null) {
            log.info("Cache hit for user:data:{}", id);
            return ApiResponse.success(cached);
        }

        log.warn("Cache miss for user:data:{}. Running DB query.", id);
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        UserResponse dto = mapToUserResponse(account);
        redisService.saveToHash(RedisData.USER_DATA, id.toString(), dto);
        return ApiResponse.success(dto);
    }

    // Admin: PUT /users/{id}
    @Transactional
    public ApiResponse<UserResponse> updateUser(UUID id, UpdateUserRequest request) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (request.getFullName() != null) account.setFullName(request.getFullName());
        if (request.getDateOfBirth() != null) account.setDateOfBirth(request.getDateOfBirth());
        if (request.getActive() != null) account.setActive(request.getActive());
        if (request.getRole() != null) account.setRole(request.getRole());
        account = accountRepository.save(account);
        
        evictUserCache(id);
        return ApiResponse.success(mapToUserResponse(account));
    }

    // Admin: DELETE /users/{id}
    @Transactional
    public ApiResponse<Void> deleteUser(UUID id) {
        if (!accountRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        accountRepository.deleteById(id);
        
        evictUserCache(id);
        return ApiResponse.success(null, "User deleted");
    }

    // Admin: GET /users/all (Dùng K-V Cache cho phân trang)
    @Transactional(readOnly = true)
    public ApiResponse<ResponseDto.PagedResponse<UserResponse>> getAllUsers(Pageable pageable) {
        String cacheKey = buildUserPageCacheKey(pageable);
        @SuppressWarnings("unchecked")
        ResponseDto.PagedResponse<UserResponse> cached = (ResponseDto.PagedResponse<UserResponse>) redisService.getValue(cacheKey);
        if (cached != null) {
            log.info("Cache hit for {}", cacheKey);
            return ApiResponse.success(cached);
        }
        
        log.warn("Cache miss for {}. Running DB query.", cacheKey);
        Page<Account> page = accountRepository.findAll(pageable);
        Page<UserResponse> dtoPage = page.map(this::mapToUserResponse);
        
        ResponseDto.PagedResponse<UserResponse> pagedResponse = ResponseDto.PagedResponse.<UserResponse>builder()
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

    // Admin: POST /users
    @Transactional
    public ApiResponse<UserResponse> createUser(CreateUserRequest request) {
        if (accountRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        Account account = Account.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .active(true)
         
               .role(request.getRole() != null ? request.getRole() : UserRole.USER)
                .build();
        account = accountRepository.save(account);

        Wallet wallet = Wallet.builder()
            .user(account)
            .balance(java.math.BigDecimal.ZERO)
            .isActive(true)
            .build();
        walletRepository.save(wallet);
        account.setWallet(wallet);
        account = accountRepository.save(account);

        evictUserCache(account.getId());
        return ApiResponse.success(mapToUserResponse(account));
    }

    private UserResponse mapToUserResponse(Account account) {
        return UserResponse.builder()
                .id(account.getId())
                .email(account.getEmail())
                .fullName(account.getFullName())
                .dateOfBirth(account.getDateOfBirth())
      
                .role(account.getRole())
                .active(account.isActive())
                .dateOfBirth(account.getDateOfBirth())
                .wallet(account.getWallet() == null ? null : WalletSummaryResponse.builder()
                        .id(account.getWallet().getId())
            
                        .balance(account.getWallet().getBalance())
                        .isActive(account.getWallet().isActive())
                        .pinSet(account.getWallet().getPinHash() != null)
                        .build())
              
                .build();
    }


    private void evictUserCache(UUID userId) {
        log.info("Evicting user caches for user {}", userId);
        if (userId != null) {
            redisService.deleteFromHash(RedisData.USER_DATA, userId.toString());
        }
        redisService.deleteKeysByPattern(USERS_PAGE_PREFIX + "*");
    }
    
    private String buildUserPageCacheKey(Pageable pageable) {
         String sortStr = pageable.getSort().isSorted() ?
            pageable.getSort().stream().map(o -> o.getProperty() + ":" + o.getDirection()).collect(Collectors.joining(","))
            : "default";
        return USERS_PAGE_PREFIX + "page:" + pageable.getPageNumber() + ":size:" + pageable.getPageSize() + ":sort:" + sortStr;
    }
}