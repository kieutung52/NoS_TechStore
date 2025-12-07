package com.nos.backend_api.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.user_info.Wallet;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {
    Optional<Wallet> findByUserId(UUID userId);
    
    @Query(value = "SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE is_active = true", nativeQuery = true)
    java.math.BigDecimal getTotalActiveBalance();
}