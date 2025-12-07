package com.nos.backend_api.repositories;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.models.auth.InvalidatedToken;

@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {
    boolean existsByTokenId(String tokenId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM InvalidatedToken it WHERE it.expiryTime < :now")
    int deleteExpired(@Param("now") Instant now);
}