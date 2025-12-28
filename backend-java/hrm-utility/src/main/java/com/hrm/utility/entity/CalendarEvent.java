package com.hrm.utility.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "`CalendarEvents`")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEvent {

    public enum EventType {
        HOLIDAY, PERSONAL, DEADLINE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`EventID`")
    private Long eventID;

    @Column(name = "`Title`", nullable = false)
    private String title;

    @Column(name = "`Description`", columnDefinition = "TEXT")
    private String description;

    @Column(name = "`StartTime`", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "`EndTime`", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "`EventType`", nullable = false)
    private EventType eventType;

    @Column(name = "`UserID`")
    private Long userID;

    @Column(name = "`CreatedBy`")
    private Long createdBy;

    @Column(name = "`Color`")
    private String color;

    @Column(name = "`CreatedAt`", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
