package com.nos.backend_api.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.user_info.Account;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    Optional<Account> findByEmail(String email);
    boolean existsByEmail(String email);
    
    Page<Account> findAllByRoleNot(String role, Pageable pageable);  
    List<Account> findByRole(String role);  
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByActive(boolean isActive);
}