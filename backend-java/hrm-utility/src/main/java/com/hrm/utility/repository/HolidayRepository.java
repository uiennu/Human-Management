package com.hrm.utility.repository;

import com.hrm.utility.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    @Query("SELECT h FROM Holiday h WHERE " +
           "(h.isRecurring = true AND " +
           "((MONTH(h.holidayDate) > MONTH(:startDate) OR (MONTH(h.holidayDate) = MONTH(:startDate) AND DAY(h.holidayDate) >= DAY(:startDate))) AND " +
           "(MONTH(h.holidayDate) < MONTH(:endDate) OR (MONTH(h.holidayDate) = MONTH(:endDate) AND DAY(h.holidayDate) <= DAY(:endDate))))) " +
           "OR (h.isRecurring = false AND h.holidayDate BETWEEN :startDate AND :endDate)")
    List<Holiday> findHolidaysInRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<Holiday> findByHolidayDateBetween(LocalDate startDate, LocalDate endDate);
}
