package com.nos.backend_api.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.product.Brand;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {
    Optional<Brand> findByName(String name);
    List<Brand> findByNameContainingIgnoreCase(String name); 
    boolean existsByName(String name);
}