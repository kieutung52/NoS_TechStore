package com.nos.backend_api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.models.payment.PaymentMethod;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Integer> {
    List<PaymentMethod> findByIsActive(boolean isActive);
    Optional<PaymentMethod> findByMethodName(String methodName);
    
    @Modifying
    @Transactional
    @Query("UPDATE PaymentMethod pm SET pm.isActive = :isActive WHERE pm.id = :id")
    int toggleActiveById(@Param("id") Integer id, @Param("isActive") boolean isActive);
}