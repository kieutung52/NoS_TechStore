package com.nos.backend_api.models.product;

import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.Formula;

import com.nos.backend_api.models.AbstractEntity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products", indexes = {
        @jakarta.persistence.Index(name = "idx_products_category_id", columnList = "category_id"),
        @jakarta.persistence.Index(name = "idx_products_brand_id", columnList = "brand_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product extends AbstractEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_products_categories", foreignKeyDefinition = "FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT"))
    private Category category;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false, foreignKey = @ForeignKey(name = "fk_products_brands", foreignKeyDefinition = "FOREIGN KEY (brand_id) REFERENCES brands(id)"))
    private Brand brand;

    @NotBlank
    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Builder.Default
    @Column(name = "quantity_in_stock", nullable = false)
    private Integer quantityInStock = 0;

    @NotNull
    @Builder.Default
    @Column(name = "quantity_sales", nullable = false)
    private Integer quantitySales = 0;

    @Builder.Default
    @Column(name = "is_published", nullable = false)
    private boolean isPublished = false;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ProductVariant> variants;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Review> reviews;

    @Transient
    @Formula("(SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = id)")
    private Double averageRating;
}