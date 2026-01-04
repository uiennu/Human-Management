package com.hrm.utility.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "LeaveRequests")
@Data // Lombok để tự tạo getter/setter
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LeaveRequestID")
    private Integer leaveRequestID;

    @Column(name = "ManagerID")
    private Integer managerID; // Đây là ID của người quản lý cần duyệt đơn này

    @Column(name = "StartDate")
    private LocalDate startDate;

    @Column(name = "EndDate")
    private LocalDate endDate;

    @Column(name = "TotalDays")
    private BigDecimal totalDays;

    @Column(name = "Status")
    private String status;

    @Column(name = "RequestedDate")
    private LocalDateTime requestedDate;

    @Column(name = "ApprovalNote")
    private String approvalNote;

    @Column(name = "ApprovedDate")
    private LocalDateTime approvedDate;

    // Join để lấy thông tin người xin nghỉ (Employee)
    @ManyToOne
    @JoinColumn(name = "EmployeeID", insertable = false, updatable = false)
    private Employee employee;

    // Join để lấy tên loại nghỉ (LeaveType)
    @ManyToOne
    @JoinColumn(name = "LeaveTypeID", insertable = false, updatable = false)
    private LeaveType leaveType;
}