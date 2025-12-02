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

<<<<<<< Updated upstream
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
=======
-- 1. Departments (ManagerID để NULL trước)
INSERT INTO Departments (DepartmentName, DepartmentCode, Description, ManagerID) VALUES 
('Technology', 'TECH', 'Phát triển phần mềm', NULL),
('Human Resources', 'HR', 'Tuyển dụng & C&B', NULL),
('Sales & Marketing', 'SALE', 'Kinh doanh', NULL);

-- 2. Employees
-- ID 1: An (Manager Tech)
-- ID 2: Bình (HR Manager)
-- ID 3: Cường (Nhân viên C&B - Role mới)
-- ID 4: Dũng (Sales Employee)
INSERT INTO Employees 
(FirstName, LastName, Email, PasswordHash, Phone, Address, HireDate, DepartmentID, ManagerID, CurrentPoints, IsActive) 
VALUES 
('An', 'Nguyễn Văn', 'an.nguyen@company.com', 'hash_123', '0901112222', '123 Lê Lợi', '2023-01-01', 1, NULL, 150.00, 1),
('Bình', 'Trần Thị', 'binh.tran@company.com', 'hash_456', '0902223333', '456 Nguyễn Huệ', '2023-02-15', 2, 1, 50.00, 1),
('Cường', 'Lê Văn', 'cuong.le@company.com', 'hash_789', '0903334444', '789 Võ Văn Tần', '2023-03-20', 2, 2, 75.00, 1), -- Cường report cho Bình (HR)
('Dũng', 'Phạm', 'dung.pham@company.com', 'hash_000', '0904445555', '321 Điện Biên Phủ', '2023-06-01', 3, 1, 20.00, 1);

-- 3. Update Department Managers
UPDATE Departments SET ManagerID = 1 WHERE DepartmentCode = 'TECH';
UPDATE Departments SET ManagerID = 2 WHERE DepartmentCode = 'HR';
UPDATE Departments SET ManagerID = 1 WHERE DepartmentCode = 'SALE'; -- Tạm thời An quản lý cả Sale

-- 4. Employee Roles (Map với RoleID bạn đã có: 1=Emp, 2=Mgr, 3=HR, 4=C&B)
INSERT INTO EmployeeRoles (EmployeeID, RoleID) VALUES 
(1, 2), -- An: Manager
(2, 3), -- Bình: HR
(3, 4), -- Cường: C&B (Dùng Role mới của bạn)
(4, 1); -- Dũng: Employee

-- 5. Profile Changes
INSERT INTO EmployeeProfileChanges (EmployeeID, FieldName, OldValue, NewValue, Status, ApproverID) VALUES 
(3, 'BankAccount', '000xxx', '111yyy', 'Pending', NULL);

-- =================================================================
-- BƯỚC 3: LEAVE MANAGEMENT (Theo yêu cầu Vacation/Sick/Personal)
-- =================================================================

-- 6. Leave Types
INSERT INTO LeaveTypes (Name, Description, DefaultQuota, Applicability) VALUES 
('Vacation', 'Nghỉ mát / Phép năm', 12.00, 'All'),
('Sick Leave', 'Nghỉ ốm', 30.00, 'All'),
('Personal Day', 'Nghỉ việc riêng', 3.00, 'All');

-- 7. Employee Leave Balances
-- 1=Vacation, 2=Sick Leave, 3=Personal Day
INSERT INTO EmployeeLeaveBalances (EmployeeID, LeaveTypeID, BalanceDays) VALUES 
(1, 1, 10.00), (1, 2, 30.00), (1, 3, 2.00), -- An
(2, 1, 12.00), (2, 2, 29.00), (2, 3, 3.00), -- Bình
(3, 1, 5.00),  (3, 2, 30.00), (3, 3, 3.00), -- Cường
(4, 1, 0.00),  (4, 2, 15.00), (4, 3, 1.00); -- Dũng

-- 8. Leave Requests (Status: Approved, Pending, Rejected, Cancelled)
INSERT INTO LeaveRequests (EmployeeID, LeaveTypeID, StartDate, EndDate, TotalDays, Reason, Status) VALUES 
(1, 1, '2025-10-20', '2025-10-22', 3.0, 'Du lịch gia đình', 'Approved'),
(3, 2, '2025-11-05', '2025-11-05', 1.0, 'Sốt cao', 'Pending'),
(4, 3, '2025-12-01', '2025-12-03', 3.0, 'Về quê đám cưới', 'Rejected'),
(1, 1, '2025-12-25', '2025-12-26', 2.0, 'Nghỉ Noel', 'Cancelled');

-- 9. Leave History
INSERT INTO LeaveRequestHistory (LeaveRequestID, Status, Notes, ChangedByEmployeeID) VALUES 
(1, 'Approved', 'Đã duyệt', 2),
(3, 'Rejected', 'Đang chạy số cuối năm', 1);

-- 10. Work Handovers
INSERT INTO WorkHandovers (LeaveRequestID, AssigneeEmployeeID, ManagerID, HandoverNotes) VALUES 
(1, 3, 2, 'Gửi Cường check bảng lương');

-- =================================================================
-- BƯỚC 4: ATTENDANCE & WFH
-- =================================================================

-- 11. Attendance Logs
INSERT INTO AttendanceLogs (EmployeeID, LogTime, LogType, Location) VALUES 
(3, '2025-11-29 08:00:00', 'CheckIn', 'Office'),
(3, '2025-11-29 17:00:00', 'CheckOut', 'Office'),
(4, '2025-11-29 08:30:00', 'CheckIn', 'Site Khách Hàng');

-- 12. Timesheet Updates
INSERT INTO TimesheetUpdateRequests (EmployeeID, WorkDate, OldCheckInTime, NewCheckInTime, Reason, Status) VALUES 
(4, '2025-11-28', NULL, '08:00:00', 'Quên chấm công', 'Approved');

-- 13. Attendance Corrections
INSERT INTO AttendanceCorrectionRequests (EmployeeID, WorkDate, RequestType, RequestedTime, Location, Reason, Status) VALUES 
(2, '2025-11-28', 'LateIn', '09:00:00', 'Office', 'Hỏng xe', 'Pending');

-- 14. WFH Requests
INSERT INTO WFHRequests (EmployeeID, StartDate, EndDate, Reason, WorkPlan, Status) VALUES 
(3, '2025-12-01', '2025-12-01', 'Sửa nhà', 'Vẫn tính lương', 'Pending');

-- =================================================================
-- BƯỚC 5: CAMPAIGNS & REWARDS
-- =================================================================

-- 15. Campaigns
INSERT INTO Campaigns (CampaignName, ShortDescription, StartDate, EndDate, TargetAudienceType, Status, CreatedByEmployeeID) VALUES 
('Marathon 2025', 'Chạy bộ gây quỹ', '2025-12-01', '2025-12-31', 'All', 'Published', 2),
('Team Building', 'Phú Quốc Trip', '2025-12-20', '2025-12-22', 'All', 'Draft', 2);

-- 16. Campaign Target Departments
INSERT INTO CampaignTargetDepartments (CampaignID, DepartmentID) VALUES (1, 1), (1, 2), (1, 3);

-- 17. Participants
INSERT INTO CampaignParticipants (CampaignID, EmployeeID, Status) VALUES 
(1, 3, 'Registered'),
(1, 4, 'Registered');

-- 18. Campaign Results
INSERT INTO CampaignResults (ParticipantID, AchievementMetric, AchievementValue) VALUES 
(1, 'Km', 10.5), -- Cường chạy 10.5km
(2, 'Km', 5.0);  -- Dũng chạy 5km

-- 19. Point Transactions
INSERT INTO PointTransactions (EmployeeID, TransactionType, Amount, Description, GiverEmployeeID) VALUES 
(3, 'Reward', 50.00, 'Xử lý lương đúng hạn', 2), -- Cường được thưởng
(4, 'Penalty', -10.00, 'Đi muộn', 2);

-- 20. Redemption Requests
INSERT INTO RedemptionRequests (EmployeeID, PointsToRedeem, CashValue, ConversionRate, Status) VALUES 
(3, 50.00, 500000, 10000, 'Processing');
>>>>>>> Stashed changes