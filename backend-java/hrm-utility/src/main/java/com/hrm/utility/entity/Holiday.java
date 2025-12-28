package com.hrm.utility.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "`Holidays`")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "`HolidayID`")
    private Long holidayID;

    @Column(name = "`Name`", nullable = false)
    private String name;

    @Column(name = "`HolidayDate`", nullable = false)
    private LocalDate holidayDate;

    @Builder.Default
    @Column(name = "`IsRecurring`")
    private boolean isRecurring = true;

    @Column(name = "`Description`")
    private String description;

    @Column(name = "`CreatedAt`", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
