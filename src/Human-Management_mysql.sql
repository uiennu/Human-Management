-- =================================================================
-- CREATE DATABASE
-- =================================================================
CREATE DATABASE IF NOT EXISTS HRM_System;
USE HRM_System;

-- =================================================================
-- SECTION 1: CORE HR & USERS
-- =================================================================

CREATE TABLE Roles (
    RoleID INT PRIMARY KEY AUTO_INCREMENT,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Departments (
    DepartmentID INT PRIMARY KEY AUTO_INCREMENT,
    DepartmentName VARCHAR(100) NOT NULL,
    DepartmentCode VARCHAR(20) UNIQUE,
    Description VARCHAR(500),
    ManagerID INT NULL
);

CREATE TABLE Employees (
    EmployeeID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    Address VARCHAR(255),
    HireDate DATE NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT 1,
    
    -- Sensitive info
    PersonalEmail VARCHAR(100),
    EmergencyContactName VARCHAR(100),
    EmergencyContactPhone VARCHAR(20),
    BankAccountNumber VARCHAR(50),
    TaxID VARCHAR(50),

    -- Relationships
    DepartmentID INT NULL,
    ManagerID INT NULL,
    
    -- Rewards
    CurrentPoints DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    AvatarUrl VARCHAR(255) NULL,

    CONSTRAINT FK_Employees_Department FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
    CONSTRAINT FK_Employees_Manager FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID)
);

-- Add the FK for Department Manager
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
    ChangeID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    FieldName VARCHAR(50) NOT NULL,
    OldValue VARCHAR(255),
    NewValue VARCHAR(255),
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    RequestedDate DATETIME NOT NULL DEFAULT NOW(),
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_ProfileChanges_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_ProfileChanges_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- SECTION 2: LEAVE MANAGEMENT
-- =================================================================

CREATE TABLE LeaveTypes (
    LeaveTypeID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description VARCHAR(500),
    DefaultQuota DECIMAL(5, 2) NOT NULL DEFAULT 0,
    Applicability VARCHAR(100)
);

CREATE TABLE EmployeeLeaveBalances (
    EmployeeLeaveBalanceID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    BalanceDays DECIMAL(5, 2) NOT NULL,
    LastUpdatedDate DATETIME NOT NULL DEFAULT NOW(),
    UNIQUE(EmployeeID, LeaveTypeID),
    CONSTRAINT FK_LeaveBalances_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_LeaveBalances_LeaveType FOREIGN KEY (LeaveTypeID) REFERENCES LeaveTypes(LeaveTypeID)
);

CREATE TABLE LeaveRequests (
    LeaveRequestID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    LeaveTypeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsHalfDayStart BOOLEAN NOT NULL DEFAULT 0,
    IsHalfDayEnd BOOLEAN NOT NULL DEFAULT 0,
    TotalDays DECIMAL(5, 2) NOT NULL,
    Reason VARCHAR(1000),
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    RequestedDate DATETIME NOT NULL DEFAULT NOW(),
    AttachmentPath VARCHAR(255) NULL, 
    
    CONSTRAINT FK_LeaveRequests_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_LeaveRequests_LeaveType FOREIGN KEY (LeaveTypeID) REFERENCES LeaveTypes(LeaveTypeID),
    CONSTRAINT CHK_LeaveRequest_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Draft'))
);

CREATE TABLE LeaveRequestHistory (
    HistoryID INT PRIMARY KEY AUTO_INCREMENT,
    LeaveRequestID INT NOT NULL,
    Status VARCHAR(20) NOT NULL,
    Notes VARCHAR(1000),
    ChangedByEmployeeID INT NOT NULL,
    ChangeDate DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_LeaveHistory_Request FOREIGN KEY (LeaveRequestID) REFERENCES LeaveRequests(LeaveRequestID) ON DELETE CASCADE,
    CONSTRAINT FK_LeaveHistory_Employee FOREIGN KEY (ChangedByEmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE WorkHandovers (
    HandoverID INT PRIMARY KEY AUTO_INCREMENT,
    LeaveRequestID INT NOT NULL,
    AssigneeEmployeeID INT NOT NULL,
    ManagerID INT NOT NULL,
    HandoverNotes TEXT,
    CreatedDate DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_Handover_Request FOREIGN KEY (LeaveRequestID) REFERENCES LeaveRequests(LeaveRequestID),
    CONSTRAINT FK_Handover_Assignee FOREIGN KEY (AssigneeEmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_Handover_Manager FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- SECTION 3: ATTENDANCE & TIMESHEET
-- =================================================================

CREATE TABLE AttendanceLogs (
    LogID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    LogTime DATETIME NOT NULL,
    LogType VARCHAR(10) NOT NULL,
    Location VARCHAR(100),
    CONSTRAINT FK_AttendanceLogs_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE TimesheetUpdateRequests (
    RequestID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    WorkDate DATE NOT NULL,
    OldCheckInTime TIME,
    OldCheckOutTime TIME,
    NewCheckInTime TIME,
    NewCheckOutTime TIME,
    Reason VARCHAR(1000) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    RequestedDate DATETIME NOT NULL DEFAULT NOW(),
    AttachmentPath VARCHAR(255) NULL,
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_TimesheetUpdate_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_TimesheetUpdate_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE AttendanceCorrectionRequests (
    RequestID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    WorkDate DATE NOT NULL,
    RequestType VARCHAR(50) NOT NULL,
    RequestedTime TIME NOT NULL,
    Location VARCHAR(100),
    Reason VARCHAR(1000) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    RequestedDate DATETIME NOT NULL DEFAULT NOW(),
    AttachmentPath VARCHAR(255) NULL,
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_AttCorrection_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_AttCorrection_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE WFHRequests (
    RequestID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Reason VARCHAR(1000) NOT NULL,
    WorkPlan TEXT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    RequestedDate DATETIME NOT NULL DEFAULT NOW(),
    AttachmentPath VARCHAR(255) NULL,
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_WFHRequest_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_WFHRequest_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- SECTION 4: ENGAGEMENT & CAMPAIGNS
-- =================================================================

CREATE TABLE Campaigns (
    CampaignID INT PRIMARY KEY AUTO_INCREMENT,
    CampaignName VARCHAR(255) NOT NULL,
    ShortDescription VARCHAR(250) NOT NULL,
    DetailedContent TEXT,
    BannerImagePath VARCHAR(255),
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    CampaignType VARCHAR(50),
    Organizer VARCHAR(100),
    TargetAudienceType VARCHAR(20) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Draft',
    AllowComments BOOLEAN NOT NULL DEFAULT 1,
    RequireRegistration BOOLEAN NOT NULL DEFAULT 0,
    CreatedByEmployeeID INT NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT NOW(),
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
    ParticipantID INT PRIMARY KEY AUTO_INCREMENT,
    CampaignID INT NOT NULL,
    EmployeeID INT NOT NULL,
    RegistrationDate DATETIME NOT NULL DEFAULT NOW(),
    Status VARCHAR(50) DEFAULT 'Registered',
    UNIQUE(CampaignID, EmployeeID),
    CONSTRAINT FK_CampaignParticipants_Campaign FOREIGN KEY (CampaignID) REFERENCES Campaigns(CampaignID) ON DELETE CASCADE,
    CONSTRAINT FK_CampaignParticipants_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE CASCADE
);

CREATE TABLE CampaignResults (
    ResultID INT PRIMARY KEY AUTO_INCREMENT,
    ParticipantID INT NOT NULL,
    AchievementMetric VARCHAR(50),
    AchievementValue DECIMAL(10, 2) NOT NULL,
    LoggedDate DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_CampaignResults_Participant FOREIGN KEY (ParticipantID) REFERENCES CampaignParticipants(ParticipantID) ON DELETE CASCADE
);

-- =================================================================
-- SECTION 5: REWARDS & POINTS
-- =================================================================

CREATE TABLE PointTransactions (
    TransactionID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    TransactionType VARCHAR(50) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    TransactionDate DATETIME NOT NULL DEFAULT NOW(),
    Description VARCHAR(500) NOT NULL,
    GiverEmployeeID INT NULL,
    CONSTRAINT FK_PointTrans_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_PointTrans_Giver FOREIGN KEY (GiverEmployeeID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE RedemptionRequests (
    RequestID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    PointsToRedeem DECIMAL(10, 2) NOT NULL,
    CashValue DECIMAL(10, 2) NOT NULL,
    ConversionRate DECIMAL(10, 4) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Processing',
    RequestedDate DATETIME NOT NULL DEFAULT NOW(),
    ApproverID INT NULL,
    ApprovalDate DATETIME NULL,
    CONSTRAINT FK_Redemption_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    CONSTRAINT FK_Redemption_Approver FOREIGN KEY (ApproverID) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- INSERT INITIAL DATA
-- =================================================================
INSERT INTO Roles (RoleName) VALUES 
('Employee'),
('Manager'),
('HR'),
('C&B');

-- =================================================================
-- INSERT SAMPLE DATA (Departments & Employees)
-- =================================================================

INSERT INTO Departments (DepartmentName, DepartmentCode, Description) VALUES 
('Human Resources', 'HR', 'Manages employee lifecycle'),
('Information Technology', 'IT', 'Manages technical infrastructure'),
('Sales', 'SALES', 'Handles sales and client relationships');

-- Insert Admin/HR Manager
INSERT INTO Employees (FirstName, LastName, Email, PasswordHash, HireDate, DepartmentID, IsActive) VALUES 
('Admin', 'User', 'admin@hrm.com', 'hashed_password_here', NOW(), 1, 1),
('John', 'Doe', 'john.doe@hrm.com', 'hashed_password_here', NOW(), 2, 1),
('Jane', 'Smith', 'jane.smith@hrm.com', 'hashed_password_here', NOW(), 3, 1);

-- Assign Roles
-- Assuming RoleIDs: 1=Employee, 2=Manager, 3=HR, 4=C&B
-- Admin -> HR & Manager
INSERT INTO EmployeeRoles (EmployeeID, RoleID) VALUES 
(1, 3), (1, 2),
(2, 1),
(3, 1);

