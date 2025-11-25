-- =================================================================
-- CREATE DATABASE
-- =================================================================
CREATE DATABASE HRM_System;
GO

USE HRM_System;
GO

-- =================================================================
-- SECTION 1: CORE HR & USERS (Based on SRS 2.8)
-- =================================================================

CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE
    -- e.g., 'Employee', 'Manager', 'HR', 'C&B'
);

CREATE TABLE Departments (
    DepartmentID INT PRIMARY KEY IDENTITY(1,1),
    DepartmentName NVARCHAR(100) NOT NULL,
    DepartmentCode NVARCHAR(20) UNIQUE,
    Description NVARCHAR(500),
    ManagerID INT NULL -- Foreign Key added after Employees table is created
);

CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL, -- For system login
    Phone NVARCHAR(20),
    Address NVARCHAR(255),
    HireDate DATE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    
    -- Sensitive info (from SRS 2.8.1)
    PersonalEmail NVARCHAR(100),
    EmergencyContactName NVARCHAR(100),
    EmergencyContactPhone NVARCHAR(20),
    BankAccountNumber NVARCHAR(50),
    TaxID NVARCHAR(50),

    -- Relationships
    DepartmentID INT NULL, -- Foreign Key added later
    ManagerID INT NULL, -- Self-referencing Foreign Key added later
    
    -- Rewards (from SRS 2.10)
    CurrentPoints DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    CONSTRAINT FK_Employees_Department FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
    CONSTRAINT FK_Employees_Manager FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID)
);

-- Add the FK for Department Manager (which references Employees)
ALTER TABLE Departments ADD CONSTRAINT FK_Departments_Manager 
    FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID);

CREATE TABLE EmployeeRoles (
    EmployeeID INT NOT NULL,
    RoleID INT NOT NULL,
    PRIMARY KEY (EmployeeID, RoleID),
    CONSTRAINT FK_EmployeeRoles_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE CASCADE,
    CONSTRAINT FK_EmployeeRoles_Role FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE CASCADE
);

CREATE TABLE EmployeeProfileChanges (
    ChangeID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    FieldName NVARCHAR(50) NOT NULL, -- e.g., 'BankAccountNumber', 'TaxID'
    OldValue NVARCHAR(255),
    NewValue NVARCHAR(255),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
    RequestedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_ProfileChanges_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_ProfileChanges_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- SECTION 2: LEAVE MANAGEMENT (Based on SRS 2.1, 2.2, 2.3)
-- =================================================================

CREATE TABLE LeaveTypes (
    LeaveTypeID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    DefaultQuota DECIMAL(5, 2) NOT NULL DEFAULT 0, -- Số ngày nghỉ phép mặc định được cấp mỗi năm
    Applicability NVARCHAR(100) -- e.g., Loại phép áp dụng cho nhóm nào (ví dụ 'All Employees', 'Female Employees')
);

CREATE TABLE EmployeeLeaveBalances (
    EmployeeLeaveBalanceID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    BalanceDays DECIMAL(5, 2) NOT NULL,
    LastUpdatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UNIQUE(EmployeeID, LeaveTypeID),
    CONSTRAINT FK_LeaveBalances_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_LeaveBalances_LeaveType FOREIGN KEY (LeaveTypeID) REFERENCES LeaveTypes(LeaveTypeID)
);

CREATE TABLE LeaveRequests (
    LeaveRequestID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsHalfDayStart BIT NOT NULL DEFAULT 0,
    IsHalfDayEnd BIT NOT NULL DEFAULT 0,
    TotalDays DECIMAL(5, 2) NOT NULL,
    Reason NVARCHAR(1000),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected, Cancelled, Draft
    RequestedDate DATETIME NOT NULL DEFAULT GETDATE(),
    AttachmentPath NVARCHAR(255) NULL, 
    
    CONSTRAINT FK_LeaveRequests_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_LeaveRequests_LeaveType FOREIGN KEY (LeaveTypeID) REFERENCES LeaveTypes(LeaveTypeID),
    CONSTRAINT CHK_LeaveRequest_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Draft'))
);

CREATE TABLE LeaveRequestHistory (
    HistoryID INT PRIMARY KEY IDENTITY(1,1),
    LeaveRequestID INT NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    Notes NVARCHAR(1000), -- e.g., Rejection reason
    ChangedByEmployeeID INT NOT NULL,
    ChangeDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_LeaveHistory_Request FOREIGN KEY (LeaveRequestID) REFERENCES LeaveRequests(LeaveRequestID) ON DELETE CASCADE,
    CONSTRAINT FK_LeaveHistory_Employee FOREIGN KEY (ChangedByEmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE WorkHandovers (
    HandoverID INT PRIMARY KEY IDENTITY(1,1),
    LeaveRequestID INT NOT NULL,
    AssigneeEmployeeID INT NOT NULL, -- Employee receiving the handover
    ManagerID INT NOT NULL, -- Manager who assigned the handover
    HandoverNotes NVARCHAR(MAX),
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Handover_Request FOREIGN KEY (LeaveRequestID) REFERENCES LeaveRequests(LeaveRequestID),
    CONSTRAINT FK_Handover_Assignee FOREIGN KEY (AssigneeEmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_Handover_Manager FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- SECTION 3: ATTENDANCE & TIMESHEET (Based on SRS 2.4, 2.5, 2.6, 2.7)
-- =================================================================

-- Assuming a base table for raw logs
CREATE TABLE AttendanceLogs (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    LogTime DATETIME NOT NULL,
    LogType NVARCHAR(10) NOT NULL, -- 'In', 'Out'
    Location NVARCHAR(100),
    CONSTRAINT FK_AttendanceLogs_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE TimesheetUpdateRequests (
    RequestID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    WorkDate DATE NOT NULL,
    OldCheckInTime TIME,
    OldCheckOutTime TIME,
    NewCheckInTime TIME,
    NewCheckOutTime TIME,
    Reason NVARCHAR(1000) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
    RequestedDate DATETIME NOT NULL DEFAULT GETDATE(),
    AttachmentPath NVARCHAR(255) NULL,
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_TimesheetUpdate_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_TimesheetUpdate_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE AttendanceCorrectionRequests (
    RequestID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    WorkDate DATE NOT NULL,
    RequestType NVARCHAR(50) NOT NULL, -- 'Late Check-in', 'Missed Check-out', etc.
    RequestedTime TIME NOT NULL,
    Location NVARCHAR(100),
    Reason NVARCHAR(1000) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
    RequestedDate DATETIME NOT NULL DEFAULT GETDATE(),
    AttachmentPath NVARCHAR(255) NULL,
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_AttCorrection_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_AttCorrection_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE WFHRequests (
    RequestID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Reason NVARCHAR(1000) NOT NULL,
    WorkPlan NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Approved, Rejected
    RequestedDate DATETIME NOT NULL DEFAULT GETDATE(),
    AttachmentPath NVARCHAR(255) NULL,
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_WFHRequest_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_WFHRequest_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- SECTION 4: ENGAGEMENT & CAMPAIGNS (Based on SRS 2.9)
-- =================================================================

CREATE TABLE Campaigns (
    CampaignID INT PRIMARY KEY IDENTITY(1,1),
    CampaignName NVARCHAR(255) NOT NULL,
    ShortDescription NVARCHAR(250) NOT NULL,
    DetailedContent NVARCHAR(MAX),
    BannerImagePath NVARCHAR(255),
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    CampaignType NVARCHAR(50), -- 'Event', 'Survey', 'Contest'
    Organizer NVARCHAR(100), -- 'Human Resources'
    TargetAudienceType NVARCHAR(20) NOT NULL, -- 'EntireCompany', 'SpecificDepartments'
    Status NVARCHAR(20) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Upcoming', 'Ongoing', 'Ended'
    AllowComments BIT NOT NULL DEFAULT 1,
    RequireRegistration BIT NOT NULL DEFAULT 0,
    CreatedByEmployeeID INT NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Campaign_Creator FOREIGN KEY (CreatedByEmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE CampaignTargetDepartments (
    CampaignID INT NOT NULL,
    DepartmentID INT NOT NULL,
    PRIMARY KEY (CampaignID, DepartmentID),
    CONSTRAINT FK_CampaignTarget_Campaign FOREIGN KEY (CampaignID) REFERENCES Campaigns(CampaignID) ON DELETE CASCADE,
    CONSTRAINT FK_CampaignTarget_Dept FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID) ON DELETE CASCADE
);

CREATE TABLE CampaignParticipants (
    ParticipantID INT PRIMARY KEY IDENTITY(1,1),
    CampaignID INT NOT NULL,
    EmployeeID INT NOT NULL,
    RegistrationDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(50) DEFAULT 'Registered', -- 'Registered', 'Completed', 'Cancelled'
    UNIQUE(CampaignID, EmployeeID),
    CONSTRAINT FK_CampaignParticipants_Campaign FOREIGN KEY (CampaignID) REFERENCES Campaigns(CampaignID) ON DELETE CASCADE,
    CONSTRAINT FK_CampaignParticipants_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE CASCADE
);

CREATE TABLE CampaignResults (
    ResultID INT PRIMARY KEY IDENTITY(1,1),
    ParticipantID INT NOT NULL,
    AchievementMetric NVARCHAR(50), -- e.g., 'km', 'steps', 'points'
    AchievementValue DECIMAL(10, 2) NOT NULL,
    LoggedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_CampaignResults_Participant FOREIGN KEY (ParticipantID) REFERENCES CampaignParticipants(ParticipantID) ON DELETE CASCADE
);

-- =================================================================
-- SECTION 5: REWARDS & POINTS (Based on SRS 2.10)
-- =================================================================

CREATE TABLE PointTransactions (
    TransactionID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    TransactionType NVARCHAR(50) NOT NULL, -- 'Allocate', 'Gift', 'Deduct', 'Redeem'
    Amount DECIMAL(10, 2) NOT NULL, -- Positive for earning, negative for spending
    TransactionDate DATETIME NOT NULL DEFAULT GETDATE(),
    Description NVARCHAR(500) NOT NULL,
    GiverEmployeeID INT NULL, -- Used for Manager 'Gift' type
    CONSTRAINT FK_PointTrans_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_PointTrans_Giver FOREIGN KEY (GiverEmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE RedemptionRequests (
    RequestID INT PRIMARY KEY IDENTITY(1,1),
    EmployeeID INT NOT NULL,
    PointsToRedeem DECIMAL(10, 2) NOT NULL,
    CashValue DECIMAL(10, 2) NOT NULL,
    ConversionRate DECIMAL(10, 4) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Processing', -- 'Processing', 'Approved', 'Paid', 'Rejected'
    RequestedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_Redemption_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_Redemption_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- INSERT INITIAL DATA (Roles)
-- =================================================================
INSERT INTO Roles (RoleName) VALUES 
('Employee'),
('Manager'),
('HR'),
('C&B');

GO
PRINT 'Database HRM_System created successfully with all tables.';
GO