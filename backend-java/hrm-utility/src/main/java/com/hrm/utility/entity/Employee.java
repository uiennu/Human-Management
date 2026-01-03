package com.hrm.utility.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Employees") // Tên bảng trong Database
@Data
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EmployeeID")
    private Integer employeeID;

    @Column(name = "FirstName")
    private String firstName;

    @Column(name = "LastName")
    private String lastName;

    @Column(name = "AvatarUrl")
    private String avatarUrl;
}