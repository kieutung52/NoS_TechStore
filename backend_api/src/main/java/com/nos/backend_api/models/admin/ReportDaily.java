package com.nos.backend_api.models.admin;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.hibernate.annotations.Immutable;

import com.nos.backend_api.models.AbstractEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "report_daily")
@Immutable 
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDaily extends AbstractEntity {
    @Id
    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "total_revenue", precision = 19, scale = 2)
    private BigDecimal totalRevenue;

    @Column(name = "total_orders")
    private Integer totalOrders;

    @Column(name = "total_products_sold")
    private Integer totalProductsSold;

    @Column(name = "new_users_registered")
    private Integer newUsersRegistered;

    @Column(name = "total_items_in_active_cart")
    private Integer totalItemsInActiveCart;

    @Column(name = "positive_reviews")
    private Integer positiveReviews;

    @Column(name = "negative_reviews")
    private Integer negativeReviews;

    @Column(name = "best_selling_products_json", columnDefinition = "JSON")
    private String bestSellingProductsJson;
}
