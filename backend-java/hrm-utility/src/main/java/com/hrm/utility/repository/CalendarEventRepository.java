package com.hrm.utility.repository;

import com.hrm.utility.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    @Query("SELECT e FROM CalendarEvent e WHERE (e.eventType = :type) OR (e.userID = :userId) OR (e.createdBy = :userId)")
    List<CalendarEvent> findRelevantEvents(@Param("userId") Long userId, @Param("type") CalendarEvent.EventType type);

    @Query("SELECT e FROM CalendarEvent e WHERE ((e.eventType = :type) OR (e.userID = :userId)) AND (e.startTime >= :start AND e.startTime <= :end)")
    List<CalendarEvent> findEventsInRange(@Param("userId") Long userId, @Param("type") CalendarEvent.EventType type, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
