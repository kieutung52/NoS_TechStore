package com.nos.backend_api.repositories;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.nos.backend_api.models.admin.ReportDaily;

@Repository
public interface ReportDailyRepository extends JpaRepository<ReportDaily, LocalDate> {
    List<ReportDaily> findByReportDateBetween(LocalDate fromDate, LocalDate toDate);
    
    @Query("SELECT r FROM ReportDaily r WHERE r.reportDate >= :fromDate")
    List<ReportDaily> findFromDate(@Param("fromDate") LocalDate fromDate);
}