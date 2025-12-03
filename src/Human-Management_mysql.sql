-- =================================================================
-- CREATE DATABASE
-- =================================================================
DROP DATABASE IF EXISTS HRM_System;
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
    ManagerID INT NOT NULL,
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
    SummitedDate DATETIME NOT NULL DEFAULT NOW(),
    ChangeDate DATETIME,
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

INSERT INTO Roles (RoleName) VALUES 
('Employee'), -- 1
('Manager'),  -- 2
('HR'),       -- 3
('C&B'),      -- 4
('Admin');    -- 5

-- 2. Departments
INSERT INTO Departments (DepartmentName, DepartmentCode, Description, ManagerID) VALUES 
('Board of Directors', 'BOD', 'Top management', NULL),
('Human Resources', 'HR', 'People management', NULL),
('IT Development', 'IT', 'Tech and Code', NULL),
('Sales & Marketing', 'SALE', 'Revenue generation', NULL),
('Finance', 'FIN', 'Money management', NULL);

-- 3. Employees
-- Logic: Alice (1) quản lý Bob (2) và Charlie (3). 
-- Charlie (3) quản lý David (4). 
-- Bob (2) quản lý Eve (5).
INSERT INTO Employees (FirstName, LastName, Email, PasswordHash, Phone, Address, HireDate, DepartmentID, IsActive, ManagerID, CurrentPoints) VALUES 
-- ID 1: Alice (Sếp tổng)
('Alice', 'Nguyen', 'alice@hrm.com', 'hashed_password_here', '0901000001', 'District 1, HCM', CURDATE(), 1, 1, NULL, 500),

-- ID 2: Bob (Sếp HR) -> Báo cáo cho Alice (1)
('Bob', 'Tran', 'bob@hrm.com', 'hashed_password_here', '0901000002', 'District 3, HCM', CURDATE(), 2, 1, 1, 200),

-- ID 3: Charlie (Sếp IT) -> Báo cáo cho Alice (1)
('Charlie', 'Le', 'charlie@hrm.com', 'hashed_password_here', '0901000003', 'Thu Duc, HCM', CURDATE(), 3, 1, 1, 300),

-- ID 4: David (Nhân viên IT) -> Báo cáo cho Charlie (3)
('David', 'Pham', 'david@hrm.com', 'hashed_password_here', '0901000004', 'Binh Thanh, HCM', CURDATE(), 3, 1, 3, 150),

-- ID 5: Eve (Nhân viên C&B) -> Báo cáo cho Bob (2)
('Eve', 'Vo', 'eve@hrm.com', 'hashed_password_here', '0901000005', 'District 7, HCM', CURDATE(), 2, 1, 2, 100);

-- Update lại Manager cho Department
UPDATE Departments SET ManagerID = 1 WHERE DepartmentID = 1;
UPDATE Departments SET ManagerID = 2 WHERE DepartmentID = 2;
UPDATE Departments SET ManagerID = 3 WHERE DepartmentID = 3;

-- 4. EmployeeRoles
INSERT INTO EmployeeRoles (EmployeeID, RoleID) VALUES 
(1, 5), -- Alice: Admin
(2, 2), -- Bob: Manager
(3, 2), -- Charlie: Manager
(4, 1), -- David: Employee
(5, 4); -- Eve: C&B

-- 5. EmployeeProfileChanges
INSERT INTO EmployeeProfileChanges (EmployeeID, FieldName, OldValue, NewValue, Status, ApproverID) VALUES 
(4, 'Address', 'Old Addr', 'New Addr Binh Thanh', 'Approved', 3), -- David đổi, Charlie duyệt
(5, 'Phone', '0901000005', '0999999999', 'Pending', NULL),
(3, 'EmergencyContact', 'None', 'Wife', 'Approved', 1), -- Charlie đổi, Alice duyệt
(2, 'TaxID', NULL, 'TAX-12345', 'Rejected', 1),
(4, 'BankAccount', '0001', '0002', 'Pending', NULL);

-- =================================================================
-- 3. INSERT LEAVE MANAGEMENT DATA (Logic ManagerID chặt chẽ)
-- =================================================================

-- 6. LeaveTypes
INSERT INTO LeaveTypes (Name, Description, DefaultQuota, Applicability) VALUES 
('Annual Leave', 'Standard vacation', 12, 'All'),
('Sick Leave', 'Medical reasons', 10, 'All'),
('Unpaid Leave', 'No salary', 0, 'All'),
('Maternity Leave', 'For mothers', 180, 'Female'),
('Remote Work', 'Work from home quota', 5, 'Office Staff');

-- 7. EmployeeLeaveBalances
INSERT INTO EmployeeLeaveBalances (EmployeeID, LeaveTypeID, BalanceDays) VALUES 
(4, 1, 12.0), (4, 2, 10.0), (5, 1, 12.0), (3, 1, 15.0), (2, 1, 15.0);

-- 8. LeaveRequests 
-- LƯU Ý: Cột ManagerID ở đây phải khớp với ManagerID trong bảng Employees
INSERT INTO LeaveRequests (EmployeeID, ManagerID, LeaveTypeID, StartDate, EndDate, TotalDays, Reason, Status, RequestedDate) VALUES 
-- Req 1: David (ID 4) xin nghỉ -> Manager là Charlie (ID 3)
(4, 3, 1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 2.0, 'Holiday', 'Pending', NOW()),

-- Req 2: Eve (ID 5) xin nghỉ -> Manager là Bob (ID 2)
(5, 2, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2.0, 'Sick', 'Approved', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Req 3: Charlie (ID 3) xin nghỉ -> Manager là Alice (ID 1)
(3, 1, 1, DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 5.0, 'Travel', 'Pending', NOW()),

-- Req 4: Bob (ID 2) xin nghỉ -> Manager là Alice (ID 1)
(2, 1, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 1.0, 'Personal', 'Approved', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Req 5: David (ID 4) xin nghỉ -> Manager là Charlie (ID 3)
(4, 3, 2, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), 1.0, 'Headache', 'Rejected', DATE_SUB(NOW(), INTERVAL 12 DAY));

-- 9. LeaveRequestHistory
-- LOGIC: ChangedByEmployeeID với status 'Approved'/'Rejected' PHẢI LÀ ManagerID tương ứng ở trên.
INSERT INTO LeaveRequestHistory (LeaveRequestID, Status, Notes, ChangedByEmployeeID, SummitedDate, ChangeDate) VALUES 
-- 1. David (ID 4) vừa nộp -> ChangedBy là David (4)
(1, 'Pending', 'Submitted', 4, NOW(), NULL),

-- 2. Eve (ID 5) đã duyệt -> ChangedBy là Bob (2)
(2, 'Approved', 'Ok get well', 2, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- 3. Charlie (ID 3) vừa nộp -> ChangedBy là Charlie (3)
(3, 'Pending', 'Submitted', 3, NOW(), NULL),

-- 4. Bob (ID 2) đã duyệt -> ChangedBy là Alice (1)
(4, 'Approved', 'Approved by Director', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),

-- 5. David (ID 4) bị từ chối -> ChangedBy là Charlie (3)
(5, 'Rejected', 'Not enough info', 3, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- 10. WorkHandovers
INSERT INTO WorkHandovers (LeaveRequestID, AssigneeEmployeeID, ManagerID, HandoverNotes) VALUES 
(1, 3, 3, 'Code review tasks'), -- David giao lại cho Charlie
(2, 2, 2, 'Email monitoring'),  -- Eve giao lại cho Bob
(3, 4, 1, 'Server maintenance'),  -- Charlie giao lại cho David
(4, 5, 1, 'Meeting notes'),       -- Bob giao lại cho Eve
(5, 3, 3, 'Pending tasks');

-- =================================================================
-- 4. INSERT ATTENDANCE & CAMPAIGNS
-- =================================================================

-- 11. AttendanceLogs
INSERT INTO AttendanceLogs (EmployeeID, LogTime, LogType, Location) VALUES 
(4, CONCAT(CURDATE(), ' 08:00:00'), 'CheckIn', 'Office'),
(4, CONCAT(CURDATE(), ' 17:00:00'), 'CheckOut', 'Office'),
(5, CONCAT(CURDATE(), ' 08:15:00'), 'CheckIn', 'Site A'),
(3, CONCAT(CURDATE(), ' 07:55:00'), 'CheckIn', 'Office'),
(2, CONCAT(CURDATE(), ' 08:05:00'), 'CheckIn', 'Office');

-- 12. TimesheetUpdateRequests (ApproverID là Manager tương ứng)
INSERT INTO TimesheetUpdateRequests (EmployeeID, WorkDate, OldCheckInTime, NewCheckInTime, Reason, Status, ApproverID) VALUES 
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, '08:00:00', 'Forgot card', 'Approved', 3), -- Charlie duyệt
(5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '08:00:00', 'Traffic', 'Pending', NULL),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, '17:00:00', 'Forgot out', 'Approved', 1), -- Alice duyệt
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, '08:00:00', 'System error', 'Rejected', 1), -- Alice từ chối
(4, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '08:30:00', '08:00:00', 'Late entry', 'Pending', NULL);

-- 13. AttendanceCorrectionRequests
INSERT INTO AttendanceCorrectionRequests (EmployeeID, WorkDate, RequestType, RequestedTime, Reason, Status, ApproverID) VALUES 
(4, CURDATE(), 'LateIn', '08:30:00', 'Rain', 'Approved', 3), -- Charlie duyệt
(5, CURDATE(), 'EarlyOut', '16:00:00', 'Doctor', 'Pending', NULL),
(3, CURDATE(), 'MissingIn', '08:00:00', 'Forgot', 'Approved', 1),
(2, CURDATE(), 'MissingOut', '17:00:00', 'Meeting', 'Rejected', 1),
(4, CURDATE(), 'LateIn', '09:00:00', 'Overslept', 'Pending', NULL);

-- 14. WFHRequests
INSERT INTO WFHRequests (EmployeeID, StartDate, EndDate, Reason, WorkPlan, Status, ApproverID) VALUES 
(4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Plumber', 'Coding Module X', 'Approved', 3),
(3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Sick child', 'Emails', 'Pending', NULL),
(2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Focus', 'Strategy', 'Approved', 1),
(5, DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Trip', 'Calls', 'Rejected', 1),
(4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Rain', 'Fix bugs', 'Draft', NULL);

-- 15. Campaigns
INSERT INTO Campaigns (CampaignName, ShortDescription, StartDate, EndDate, TargetAudienceType, CreatedByEmployeeID) VALUES 
('Summer Trip', 'Beach Party', DATE_ADD(NOW(), INTERVAL 1 MONTH), DATE_ADD(NOW(), INTERVAL 35 DAY), 'All', 2),
('Code Hackathon', 'Best Coder', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY), 'Specific', 3),
('Charity Run', 'Run for Heart', DATE_ADD(NOW(), INTERVAL 2 MONTH), DATE_ADD(NOW(), INTERVAL 65 DAY), 'All', 2),
('Sales Push', 'Q4 Targets', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), 'Specific', 5),
('Health Check', 'Annual Checkup', DATE_ADD(NOW(), INTERVAL 3 MONTH), DATE_ADD(NOW(), INTERVAL 3 MONTH), 'All', 2);

-- 16. CampaignTargetDepartments
INSERT INTO CampaignTargetDepartments (CampaignID, DepartmentID) VALUES 
(1, 1), (1, 2), (1, 3), (2, 3), (4, 4); 

-- 17. CampaignParticipants
INSERT INTO CampaignParticipants (CampaignID, EmployeeID, Status) VALUES 
(1, 3, 'Registered'), (1, 4, 'Registered'), (1, 5, 'Registered'), (2, 4, 'Winner'), (4, 5, 'Registered');

-- 18. CampaignResults
INSERT INTO CampaignResults (ParticipantID, AchievementMetric, AchievementValue) VALUES 
(1, 'Attendance', 1.0), (2, 'Attendance', 1.0), (3, 'Attendance', 1.0), (4, 'Score', 95.5), (5, 'Revenue', 5000.00);

-- 19. PointTransactions
INSERT INTO PointTransactions (EmployeeID, TransactionType, Amount, Description, GiverEmployeeID) VALUES 
(4, 'Earned', 50, 'Project Completion', 3),
(5, 'Earned', 100, 'Sales Target', 1),
(3, 'Earned', 20, 'Helping others', 2),
(4, 'Redeemed', -10, 'Bought Mug', NULL),
(2, 'Earned', 200, 'Yearly Bonus', 1);

-- 20. RedemptionRequests
INSERT INTO RedemptionRequests (EmployeeID, PointsToRedeem, CashValue, ConversionRate, Status) VALUES 
(4, 10, 10, 1.0, 'Completed'),
(5, 50, 50, 1.0, 'Processing'),
(3, 100, 100, 1.0, 'Pending'),
(2, 20, 20, 1.0, 'Rejected'),
(4, 5, 5, 1.0, 'Processing');
