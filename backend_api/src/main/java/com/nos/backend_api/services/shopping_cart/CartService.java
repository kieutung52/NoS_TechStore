package com.nos.backend_api.services.shopping_cart;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.request.RequestDto.AddCartItemRequest;
import com.nos.backend_api.DTO.request.RequestDto.UpdateCartItemRequest;
import com.nos.backend_api.DTO.response.ApiResponse;
import com.nos.backend_api.DTO.response.ResponseDto;
import com.nos.backend_api.DTO.response.ResponseDto.CartResponse;
import com.nos.backend_api.exceptions.AppException;
import com.nos.backend_api.exceptions.ErrorCode;
import com.nos.backend_api.models.product.ProductVariant;
import com.nos.backend_api.models.shopping_cart.CartItem;
import com.nos.backend_api.models.shopping_cart.CartItemId;
import com.nos.backend_api.models.shopping_cart.ShoppingCart;
import com.nos.backend_api.models.user_info.Account;
import com.nos.backend_api.repositories.AccountRepository;
import com.nos.backend_api.repositories.CartItemRepository;
import com.nos.backend_api.repositories.ProductVariantRepository;
import com.nos.backend_api.repositories.ShoppingCartRepository;
import com.nos.backend_api.services._system.RedisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Service
@RequiredArgsConstructor
@Slf4j 
public class CartService {
    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final AccountRepository accountRepository;
    private final RedisService redisService;

    
    private String getCartKey(UUID userId) { return "cart:" + userId.toString(); 
    }

    // GET /carts
    @Transactional(readOnly = true)
    public ApiResponse<CartResponse> getCart(UUID userId) {
        String cacheKey = getCartKey(userId); 
        CartResponse cached = (CartResponse) redisService.getValue(cacheKey); 
        if (cached != null) {
            log.info("Cache hit for {}", cacheKey); 
            return ApiResponse.success(cached); 
        }
        
        log.warn("Cache miss for {}. Running DB query.", cacheKey); 
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> createCart(userId)); 
        CartResponse response = buildCartResponse(cart); 
        redisService.setValue(cacheKey, response, 1, java.util.concurrent.TimeUnit.DAYS); 
        
        return ApiResponse.success(response); 
    }

    // POST /carts/items
    @Transactional
    public ApiResponse<CartResponse> addItem(UUID userId, AddCartItemRequest request) {
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> createCart(userId)); 
        ProductVariant variant = variantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND)); 
        CartItemId id = new CartItemId(cart.getId(), request.getProductVariantId()); 
        CartItem item = cartItemRepository.findById(id)
                .orElse(CartItem.builder()
                        .id(id)
                        .cart(cart)
                        .productVariant(variant)
   
                        .quantity(0) 
                        .build()); 
        item.setQuantity(item.getQuantity() + request.getQuantity()); 
        cartItemRepository.save(item); 
        cartItemRepository.flush(); 
        cart = cartRepository.findById(cart.getId()).orElseThrow();
        evictCartCache(userId); 
        return ApiResponse.success(buildCartResponse(cart)); 
    }

    // PUT /carts/items/{itemId}
    @Transactional
    public ApiResponse<CartResponse> updateItem(UUID userId, UUID variantId, UpdateCartItemRequest request) {
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND)); 
        CartItemId id = new CartItemId(cart.getId(), variantId); 
        CartItem item = cartItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND)); 
        if (request.getQuantity() == null || request.getQuantity() <= 0) { 
            cartItemRepository.delete(item); 
        } else {
            item.setQuantity(request.getQuantity()); 
            cartItemRepository.save(item); 
        }
        
        evictCartCache(userId); 
        return ApiResponse.success(buildCartResponse(cart)); 
    }

    // DELETE /carts/items/{itemId}
    @Transactional
    public ApiResponse<Void> deleteItem(UUID userId, UUID variantId) {
        ShoppingCart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND)); 
        CartItemId id = new CartItemId(cart.getId(), variantId); 
        if (!cartItemRepository.existsById(id)) {
             throw new AppException(ErrorCode.NOT_FOUND); 
        }
    
        cartItemRepository.deleteById(id); 
        
        evictCartCache(userId); 
        return ApiResponse.success(null, "Item deleted"); 
    }

    // DELETE /carts/clear
    @Transactional
    public ApiResponse<Void> clearCart(UUID userId) {
        cartRepository.findByUserId(userId).orElseThrow(); 
        cartItemRepository.deleteByUserId(userId); 
        
        evictCartCache(userId); 
        return ApiResponse.success(null, "Cart cleared"); 
    }

    private ShoppingCart createCart(UUID userId) {
        Account user = accountRepository.findById(userId).orElseThrow(); 
        ShoppingCart cart = ShoppingCart.builder().user(user).build(); 
        return cartRepository.save(cart); 
    }

    private CartResponse buildCartResponse(ShoppingCart cart) {
        return ResponseDto.CartResponse.builder()
                .id(cart.getId()) 
                .items(cart.getCartItems() == null ? null : cart.getCartItems().stream().map(item -> ResponseDto.CartItemResponse.builder()
                        .productVariantId(item.getProductVariant().getId()) 
             
                        .productName(item.getProductVariant().getProduct().getName()) 
                        .price(item.getProductVariant().getPrice()) 
                        .quantity(item.getQuantity()) 
                        .addedAt(item.getAddedAt()) 
                 
                        .imageUrls(item.getProductVariant().getImages() == null ? null : item.getProductVariant().getImages().stream().map(img -> img.getImageUrl()).collect(Collectors.toSet())) 
                        .build())
                        .collect(Collectors.toList())) 
                .totalAmount(calculateTotal(cart)) 
                .totalItems(cart.getCartItems() == null ?
                0 : (int) cart.getCartItems().stream().mapToInt(CartItem::getQuantity).sum()) 
                .build(); 
    }

    private BigDecimal calculateTotal(ShoppingCart cart) {
        return cart.getCartItems() == null ?
        BigDecimal.ZERO : cart.getCartItems().stream()
                .map(item -> item.getProductVariant().getPrice().multiply(new BigDecimal(item.getQuantity()))) 
                .reduce(BigDecimal.ZERO, BigDecimal::add); 
    }

    
    private void evictCartCache(UUID userId) {
        log.info("Evicting cart cache for user {}", userId); 
        redisService.deleteKey(getCartKey(userId)); 
    }
}