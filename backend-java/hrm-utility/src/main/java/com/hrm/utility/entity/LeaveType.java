package com.hrm.utility.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "LeaveTypes") // Tên bảng trong Database
@Data
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LeaveTypeID")
    private Integer leaveTypeID;

    @Column(name = "Name")
    private String name;
}