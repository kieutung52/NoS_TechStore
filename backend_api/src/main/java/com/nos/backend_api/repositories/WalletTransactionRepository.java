package com.nos.backend_api.repositories;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.payment.WalletTransaction;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID>, JpaSpecificationExecutor<WalletTransaction> {
    Page<WalletTransaction> findByWalletId(UUID walletId, Pageable pageable);
    Page<WalletTransaction> findAllByWalletUserId(UUID userId, Pageable pageable);
}