package com.hrm.utility.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LeaveRequestResponseDto {
    private Integer leaveRequestID;
    private String employeeName; // Tên người xin nghỉ
    private String avatarUrl;    // Avatar người xin nghỉ
    private Integer leaveTypeId;
    private String leaveTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalDays;
    private String status;
    private String requestedDate;
}