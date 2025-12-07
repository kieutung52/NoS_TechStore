package com.nos.backend_api.repositories;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.nos.backend_api.DTO.data.enums.OrderStatus;
import com.nos.backend_api.models.payment.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID>, JpaSpecificationExecutor<Order> {
    Page<Order> findByUserId(UUID userId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    Page<Order> findAllByUserId(UUID userId, Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("UPDATE Order o SET o.status = :status WHERE o.id = :id")
    int updateStatusById(@Param("id") UUID id, @Param("status") OrderStatus status);
    
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'DELIVERED' AND o.orderDate >= :fromDate")
    java.math.BigDecimal getTotalRevenueFromDate(@Param("fromDate") java.time.LocalDateTime fromDate);
    int countByOrderDateGreaterThanEqualAndStatus(LocalDateTime todayStart, OrderStatus delivered);
    long countByOrderDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, OrderStatus status);
}