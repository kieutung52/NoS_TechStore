package com.nos.backend_api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.product.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    List<Category> findByParentCategoryId(Integer parentId);
    List<Category> findByParentCategoryIsNull();  
    
    Optional<Category> findByName(String name);
    
    @Query("SELECT c FROM Category c " +
           "LEFT JOIN FETCH c.childrenCategories cc " +
           "LEFT JOIN FETCH c.products p " +
           "LEFT JOIN FETCH p.brand " +
           "LEFT JOIN FETCH p.variants pv " +
           "LEFT JOIN FETCH pv.images pvi " +
           "WHERE c.parentCategory IS NULL")
    List<Category> findRootWithChildren();
}