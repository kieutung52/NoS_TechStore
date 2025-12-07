package com.nos.backend_api.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.payment.OrderDetail;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {
    List<OrderDetail> findByOrderId(UUID orderId);
    @Query("SELECT COALESCE(SUM(od.quantity), 0) FROM OrderDetail od JOIN od.order o " +
           "WHERE o.orderDate >= :start AND o.orderDate < :end " +
           "AND o.status = com.nos.backend_api.DTO.data.enums.OrderStatus.DELIVERED")
    int sumQuantityByOrderDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(od) > 0 FROM OrderDetail od " +
       "JOIN od.order o " +
       "WHERE o.user.id = :userId AND od.productVariant.product.id = :productId " +
       "AND o.status = 'DELIVERED'")
    boolean existsByUserPurchase(@Param("userId") UUID userId, @Param("productId") UUID productId);
}