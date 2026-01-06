-- =================================================================
-- CREATE DATABASE
-- =================================================================
DROP DATABASE IF EXISTS HRM_System;
CREATE DATABASE IF NOT EXISTS HRM_System;
USE HRM_System;

-- =================================================================
-- SECTION 1: CORE HR & USERS (SCHEMA)
-- =================================================================
-- (Giữ nguyên cấu trúc bảng như cũ)

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
    Gender VARCHAR(10) NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    Address VARCHAR(255),
    HireDate DATE NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT 1,
    
    -- Sensitive info
    PersonalEmail VARCHAR(100),
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

ALTER TABLE Departments ADD CONSTRAINT FK_Departments_Manager 
    FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID);

CREATE TABLE EmployeeEmergencyContacts (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Relation VARCHAR(50),
    Phone VARCHAR(20),
    CONSTRAINT FK_EmergContact_Employee FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE CASCADE
);

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

CREATE TABLE EmployeeProfileChangeDocuments (
    DocumentID INT PRIMARY KEY AUTO_INCREMENT,
    ChangeID INT NOT NULL,
    DocumentPath VARCHAR(500) NOT NULL,
    DocumentName VARCHAR(255) NOT NULL,
    UploadedDate DATETIME NOT NULL DEFAULT NOW(),
    CONSTRAINT FK_ChangeDocuments_Change FOREIGN KEY (ChangeID) REFERENCES EmployeeProfileChanges(ChangeID) ON DELETE CASCADE
);

CREATE TABLE SubTeams (
    SubTeamID INT PRIMARY KEY AUTO_INCREMENT,
    TeamName VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    DepartmentID INT NOT NULL,
    TeamLeadID INT NULL,

    CONSTRAINT FK_SubTeam_Department 
        FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
    CONSTRAINT FK_SubTeam_Lead 
        FOREIGN KEY (TeamLeadID) REFERENCES Employees(EmployeeID)
);

CREATE TABLE SubTeamMembers (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    SubTeamID INT NOT NULL,
    EmployeeID INT NOT NULL,
    
    -- Allow an employee to belong to multiple teams (within same department).
    -- Business rule enforcement is handled at application/referential level.
    CONSTRAINT FK_SubTeamMembers_SubTeam 
        FOREIGN KEY (SubTeamID) REFERENCES SubTeams(SubTeamID) ON DELETE CASCADE,
    CONSTRAINT FK_SubTeamMembers_Employee 
        FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE CASCADE
);

CREATE TABLE OrganizationStructureLogs (
    LogID INT PRIMARY KEY AUTO_INCREMENT,
    EventType VARCHAR(100) NOT NULL,    -- VD: CreateSubTeam, AssignManager, TransferEmployee
    TargetEntity VARCHAR(50) NOT NULL,  -- VD: Department, SubTeam, Employee
    TargetID INT NOT NULL,              -- ID của đối tượng bị tác động
    EventData JSON NOT NULL,            -- Chi tiết thay đổi (JSON)
    PerformedBy INT NOT NULL,           -- Người thực hiện (Thường là Admin hoặc HR)
    PerformedAt DATETIME NOT NULL DEFAULT NOW(),
    
    CONSTRAINT FK_OrgLog_Performer FOREIGN KEY (PerformedBy) REFERENCES Employees(EmployeeID)
);

-- =================================================================
-- SECTION 2: LEAVE MANAGEMENT (SCHEMA)
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
    ApprovalNote TEXT NULL,
    ApprovedDate DATETIME NULL,
    
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
-- SECTION 3: ATTENDANCE & TIMESHEET (SCHEMA)
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
-- SECTION 4: ENGAGEMENT & CAMPAIGNS (SCHEMA)
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
-- SECTION 5: REWARDS & POINTS (SCHEMA)
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

CREATE TABLE EmployeeEvents (
    EventID BIGINT PRIMARY KEY AUTO_INCREMENT,
    AggregateID INT NOT NULL, 
    EventType VARCHAR(100) NOT NULL, 
    EventData JSON NOT NULL, 
    
    -- Cột này lưu thứ tự sự kiện (1, 2, 3...) cho từng nhân viên
    SequenceNumber INT NOT NULL, 
    
    -- Cột này lưu phiên bản cấu trúc JSON (Mặc định là 1)
    EventVersion INT NOT NULL DEFAULT 1, 
    
    CreatedBy INT NULL, 
    CreatedAt DATETIME DEFAULT NOW(),
    
    -- Đảm bảo mỗi nhân viên có các sự kiện theo thứ tự 1, 2, 3... không trùng lặp
    UNIQUE KEY UQ_Employee_Sequence (AggregateID, SequenceNumber),
    INDEX IX_AggregateID (AggregateID)
);


-- =================================================================
-- INSERT DATA
-- =================================================================

-- 1. Roles (Giữ cũ, thêm mới cho Sales và Finance)
INSERT INTO Roles (RoleName) VALUES 
('IT Employee'),      -- 1
('IT Manager'),       -- 2
('HR Manager'),       -- 3
('HR Employee'),      -- 4
('Admin'),            -- 5
('Sales Manager'),    -- 6 (Mới)
('Sales Employee'),   -- 7 (Mới)
('Finance Manager'),  -- 8 (Mới)
('Finance Employee'), -- 9 (Mới)
('BOD Assistant');    -- 10 (Mới)

-- 2. Departments (Giữ nguyên)
INSERT INTO Departments (DepartmentName, DepartmentCode, Description, ManagerID) VALUES 
('Board of Directors', 'BOD', 'Top management', NULL),
('Human Resources', 'HR', 'People management', NULL),
('IT Development', 'IT', 'Tech and Code', NULL),
('Sales & Marketing', 'SALE', 'Revenue generation', NULL),
('Finance', 'FIN', 'Money management', NULL);

-- 3. Employees
-- LOGIC CŨ: 1(Alice-BOD), 2(Bob-HR), 3(Charlie-IT), 4(David-IT), 5(Eve-HR)
-- LOGIC MỚI BỔ SUNG:
-- ID 6: Frank (Sales Manager) -> Report to Alice
-- ID 7: Grace (Finance Manager) -> Report to Alice
-- ID 8: Harry (IT Frontend) -> Report to Charlie (để IT team đủ 2 người trở lên)
-- ID 9: Ivy (HR C&B) -> Report to Bob (để team C&B đủ người)
-- ID 10: Jack (HR C&B) -> Report to Bob
-- ID 11: Liam (Sales Employee) -> Report to Frank
-- ID 12: Mia (Finance Employee) -> Report to Grace
-- ID 13: Kevin (BOD Assistant) -> Report to Alice (để BOD có team)
-- ID 14: Laura (BOD Assistant) -> Report to Alice

INSERT INTO Employees (
    FirstName, LastName, Email, PasswordHash, Phone, Address, HireDate, DepartmentID, IsActive, ManagerID, CurrentPoints, Gender, PersonalEmail, BankAccountNumber, TaxID, AvatarUrl
) VALUES
-- --- NHÂN VIÊN CŨ ---
-- ID 1: Alice (Sếp tổng)
('Alice', 'Nguyen', 'alice@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000001', 'District 1, HCM', CURDATE(), 1, 1, NULL, 500, 'Female', 'alice.personal@gmail.com', '123456789', 'TAX-ALICE', 'https://randomuser.me/api/portraits/women/1.jpg'),

-- ID 2: Bob (Sếp HR)
('Bob', 'Tran', 'bob@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000002', 'District 3, HCM', CURDATE(), 2, 1, 1, 200, 'Male', 'bob.personal@gmail.com', '987654321', 'TAX-BOB', 'https://randomuser.me/api/portraits/men/2.jpg'),

-- ID 3: Charlie (Sếp IT)
('Charlie', 'Le', 'charlie@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000003', 'Thu Duc, HCM', CURDATE(), 3, 1, 1, 300, 'Male', 'charlie.personal@gmail.com', '1122334455', 'TAX-CHARLIE', 'https://randomuser.me/api/portraits/men/3.jpg'),

-- ID 4: David (Nhân viên IT)
('David', 'Pham', 'david@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000004', 'Binh Thanh, HCM', CURDATE(), 3, 1, 3, 150, 'Male', 'david.personal@gmail.com', '5566778899', 'TAX-DAVID', 'https://randomuser.me/api/portraits/men/4.jpg'),

-- ID 5: Eve (Nhân viên HR)
('Eve', 'Vo', 'eve@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000005', 'District 7, HCM', CURDATE(), 2, 1, 2, 100, 'Female', 'eve.personal@gmail.com', '9988776655', 'TAX-EVE', 'https://randomuser.me/api/portraits/women/5.jpg'),

-- --- NHÂN VIÊN MỚI (Bổ sung để đủ điều kiện Manager cho Dept và đủ người cho Team) ---

-- ID 6: Frank (Sales Manager)
('Frank', 'Do', 'frank@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000006', 'District 4, HCM', CURDATE(), 4, 1, 1, 250, 'Male', 'frank.personal@gmail.com', '6655443322', 'TAX-FRANK', 'https://randomuser.me/api/portraits/men/6.jpg'),

-- ID 7: Grace (Finance Manager)
('Grace', 'Hoang', 'grace@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000007', 'District 2, HCM', CURDATE(), 5, 1, 1, 250, 'Female', 'grace.personal@gmail.com', '7788990011', 'TAX-GRACE', 'https://randomuser.me/api/portraits/women/7.jpg'),

-- ID 8: Harry (IT Employee - Frontend)
('Harry', 'Vu', 'harry@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000008', 'Tan Binh, HCM', CURDATE(), 3, 1, 3, 120, 'Male', 'harry.personal@gmail.com', '2233445566', 'TAX-HARRY', 'https://randomuser.me/api/portraits/men/8.jpg'),

-- ID 9: Ivy (HR Employee - C&B)
('Ivy', 'Ly', 'ivy@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000009', 'Go Vap, HCM', CURDATE(), 2, 1, 2, 110, 'Female', 'ivy.personal@gmail.com', '3344556677', 'TAX-IVY', 'https://randomuser.me/api/portraits/women/9.jpg'),

-- ID 10: Jack (HR Employee - C&B)
('Jack', 'To', 'jack@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000010', 'Phu Nhuan, HCM', CURDATE(), 2, 1, 2, 110, 'Male', 'jack.personal@gmail.com', '4455667788', 'TAX-JACK', 'https://randomuser.me/api/portraits/men/10.jpg'),

-- ID 11: Liam (Sales Employee)
('Liam', 'Dang', 'liam@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000011', 'District 5, HCM', CURDATE(), 4, 1, 6, 130, 'Male', 'liam.personal@gmail.com', '5566778800', 'TAX-LIAM', 'https://randomuser.me/api/portraits/men/11.jpg'),

-- ID 12: Mia (Finance Employee)
('Mia', 'Cao', 'mia@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000012', 'District 8, HCM', CURDATE(), 5, 1, 7, 140, 'Female', 'mia.personal@gmail.com', '6677889911', 'TAX-MIA', 'https://randomuser.me/api/portraits/women/12.jpg'),

-- ID 13: Kevin (BOD Assistant)
('Kevin', 'Truong', 'kevin@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000013', 'District 1, HCM', CURDATE(), 1, 1, 1, 180, 'Male', 'kevin.personal@gmail.com', '8899001122', 'TAX-KEVIN', 'https://randomuser.me/api/portraits/men/13.jpg'),

-- ID 14: Laura (BOD Assistant)
('Laura', 'Bui', 'laura@hrm.com', '$2a$11$jPe9nGpFaZHptsngP.dKGe8z/nStZ8YcPap7HN/D4LhjVvbJ5LFfe', '0901000014', 'District 3, HCM', CURDATE(), 1, 1, 1, 180, 'Female', 'laura.personal@gmail.com', '9900112233', 'TAX-LAURA', 'https://randomuser.me/api/portraits/women/14.jpg');


-- Emergency contacts
INSERT INTO EmployeeEmergencyContacts (EmployeeID, Name, Relation, Phone) VALUES
(1, 'Bob Nguyen', 'Husband', '0901111111'),
(2, 'Linda Tran', 'Wife', '0901222222'),
(3, 'Anna Le', 'Wife', '0901333333'),
(4, 'Mary Pham', 'Mother', '0901444444'),
(5, 'Tom Vo', 'Father', '0901555555'),
(6, 'Sarah Do', 'Wife', '0901666666'),
(7, 'Paul Hoang', 'Husband', '0901777777'),
(8, 'Mom Vu', 'Mother', '0901888888'),
(9, 'Dad Ly', 'Father', '0901999999'),
(10, 'Sis To', 'Sister', '0901000000'),
(11, 'Bro Dang', 'Brother', '0901121212'),
(12, 'Mom Cao', 'Mother', '0901232323'),
(13, 'Wife Truong', 'Wife', '0901343434'),
(14, 'Husband Bui', 'Husband', '0901454545');

-- Update lại Manager cho Department (Đảm bảo mỗi phòng ban đều có Manager)
UPDATE Departments SET ManagerID = 1 WHERE DepartmentID = 1; -- BOD: Alice
UPDATE Departments SET ManagerID = 2 WHERE DepartmentID = 2; -- HR: Bob
UPDATE Departments SET ManagerID = 3 WHERE DepartmentID = 3; -- IT: Charlie
UPDATE Departments SET ManagerID = 6 WHERE DepartmentID = 4; -- Sales: Frank (Mới)
UPDATE Departments SET ManagerID = 7 WHERE DepartmentID = 5; -- Finance: Grace (Mới)

-- 4. EmployeeRoles
INSERT INTO EmployeeRoles (EmployeeID, RoleID) VALUES 
(1, 5), -- Alice: Admin
(2, 3), -- Bob: HR Manager
(3, 2), -- Charlie: IT Manager
(4, 1), -- David: IT Employee
(5, 4), -- Eve: HR Employee
(6, 6), -- Frank: Sales Manager
(7, 8), -- Grace: Finance Manager
(8, 1), -- Harry: IT Employee
(9, 4), -- Ivy: HR Employee
(10, 4), -- Jack: HR Employee
(11, 7), -- Liam: Sales Employee
(12, 9), -- Mia: Finance Employee
(13, 10), -- Kevin: BOD Assistant
(14, 10); -- Laura: BOD Assistant

-- 5. EmployeeProfileChanges (Giữ nguyên mẫu cũ)
INSERT INTO EmployeeProfileChanges (EmployeeID, FieldName, OldValue, NewValue, Status, ApproverID) VALUES 
(4, 'Address', 'Old Addr', 'New Addr Binh Thanh', 'Approved', 3), 
(5, 'Phone', '0901000005', '0999999999', 'Pending', NULL),
(3, 'EmergencyContact', 'None', 'Wife', 'Approved', 1),
(2, 'TaxID', NULL, 'TAX-12345', 'Rejected', 1),
(4, 'BankAccount', '0001', '0002', 'Pending', NULL);

-- =================================================================
-- 3. INSERT LEAVE MANAGEMENT DATA
-- =================================================================

-- 6. LeaveTypes
INSERT INTO LeaveTypes (Name, Description, DefaultQuota, Applicability) VALUES 
('Annual Leave', 'Standard vacation', 12, 'All'),
('Sick Leave', 'Medical reasons', 10, 'All'),
('Unpaid Leave', 'No salary', 0, 'All'),
('Maternity Leave', 'For mothers', 180, 'Female'),
('Remote Work', 'Work from home quota', 5, 'Office Staff');

-- 7. EmployeeLeaveBalances (Tự động tính cho TẤT CẢ nhân viên, kể cả người mới)
INSERT INTO EmployeeLeaveBalances (EmployeeID, LeaveTypeID, BalanceDays)
SELECT 
    e.EmployeeID,
    lt.LeaveTypeID,
    lt.DefaultQuota
FROM Employees e
CROSS JOIN LeaveTypes lt
WHERE NOT EXISTS (
    SELECT 1
    FROM EmployeeLeaveBalances elb
    WHERE elb.EmployeeID = e.EmployeeID
      AND elb.LeaveTypeID = lt.LeaveTypeID
)
AND (lt.Name != 'Maternity Leave' OR e.Gender = 'Female');

-- 8. LeaveRequests (Giữ dữ liệu cũ làm mẫu)
INSERT INTO LeaveRequests (EmployeeID, ManagerID, LeaveTypeID, StartDate, EndDate, TotalDays, Reason, Status, RequestedDate) VALUES 
(4, 3, 1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 2.0, 'Holiday', 'Pending', NOW()),
(5, 2, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2.0, 'Sick', 'Approved', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 1, 1, DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 5.0, 'Travel', 'Pending', NOW()),
(2, 1, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 1.0, 'Personal', 'Approved', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 3, 2, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), 1.0, 'Headache', 'Rejected', DATE_SUB(NOW(), INTERVAL 12 DAY));

-- 9. LeaveRequestHistory
INSERT INTO LeaveRequestHistory (LeaveRequestID, Status, Notes, ChangedByEmployeeID, SummitedDate, ChangeDate) VALUES 
(1, 'Pending', 'Submitted', 4, NOW(), NULL),
(2, 'Approved', 'Ok get well', 2, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'Pending', 'Submitted', 3, NOW(), NULL),
(4, 'Approved', 'Approved by Director', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(5, 'Rejected', 'Not enough info', 3, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- 10. WorkHandovers
INSERT INTO WorkHandovers (LeaveRequestID, AssigneeEmployeeID, ManagerID, HandoverNotes) VALUES 
(1, 3, 3, 'Code review tasks'),
(2, 2, 2, 'Email monitoring'), 
(3, 4, 1, 'Server maintenance'), 
(4, 5, 1, 'Meeting notes'),       
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

-- 12. TimesheetUpdateRequests
INSERT INTO TimesheetUpdateRequests (EmployeeID, WorkDate, OldCheckInTime, NewCheckInTime, Reason, Status, ApproverID) VALUES 
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, '08:00:00', 'Forgot card', 'Approved', 3),
(5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:00:00', '08:00:00', 'Traffic', 'Pending', NULL),
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, '17:00:00', 'Forgot out', 'Approved', 1),
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, '08:00:00', 'System error', 'Rejected', 1),
(4, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '08:30:00', '08:00:00', 'Late entry', 'Pending', NULL);

-- 13. AttendanceCorrectionRequests
INSERT INTO AttendanceCorrectionRequests (EmployeeID, WorkDate, RequestType, RequestedTime, Reason, Status, ApproverID) VALUES 
(4, CURDATE(), 'LateIn', '08:30:00', 'Rain', 'Approved', 3),
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

-- 21. EmployeeEvents (Tự động lấy tất cả Employee mới và cũ)
INSERT INTO EmployeeEvents (AggregateID, EventType, EventData, SequenceNumber, EventVersion, CreatedBy, CreatedAt)
SELECT
    e.EmployeeID,           -- AggregateID
    'EmployeeImported',     -- EventType
    JSON_OBJECT(            -- EventData (Full thông tin tại thời điểm hiện tại)
        'EmployeeID', e.EmployeeID,
        'FirstName', e.FirstName,
        'LastName', e.LastName,
        'FullName', CONCAT(e.FirstName, ' ', e.LastName),
        'Gender', e.Gender,
        'Email', e.Email,
        'Phone', e.Phone,
        'Address', e.Address,
        'HireDate', DATE_FORMAT(e.HireDate, '%Y-%m-%d'),
        'IsActive', e.IsActive,
        
        -- Sensitive Info
        'PersonalEmail', e.PersonalEmail,
        'BankAccountNumber', e.BankAccountNumber,
        'TaxID', e.TaxID,
        
        -- Relations
        'DepartmentID', e.DepartmentID,
        'DepartmentName', d.DepartmentName,
        'ManagerID', e.ManagerID,
        'ManagerName', CONCAT(m.FirstName, ' ', m.LastName),
        
        -- Extras
        'CurrentPoints', e.CurrentPoints,
        'AvatarUrl', e.AvatarUrl
    ),
    1,  -- SequenceNumber: Luôn là 1 cho dữ liệu khởi tạo
    1,  -- EventVersion: Mặc định là 1
    1,  -- CreatedBy: Giả sử Admin (Alice - ID 1) là người import
    NOW()
FROM Employees e
LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
LEFT JOIN Employees m ON e.ManagerID = m.EmployeeID;

-- ==============================================
-- 5. TẠO CÁC SUBTEAMS (Đảm bảo mỗi Department có ít nhất 1 team)
-- ==============================================
INSERT INTO SubTeams (TeamName, Description, DepartmentID, TeamLeadID) VALUES
-- IT (2 Teams cũ)
('Backend Core', 'Responsible for API, Database', 3, 3),   -- Lead: Charlie
('Frontend UI', 'Responsible for Interface', 3, 8),        -- Lead: Harry (updated to match IT department)

-- HR (2 Teams cũ)
('Talent Acquisition', 'Recruiting', 2, 2),                -- Lead: Bob
('C&B Team', 'Compensation and Benefits', 2, 2),           -- Lead: Bob

-- Sales (1 Team Mới)
('Sales Force', 'Direct Sales Team', 4, 6),                -- Lead: Frank

-- Finance (1 Team Mới)
('Finance Audit', 'Internal Audit & Report', 5, 7),        -- Lead: Grace

-- BOD (1 Team Mới)
('Strategic Board', 'Company Strategy Planning', 1, 1);    -- Lead: Alice

-- ==============================================
-- 6. THÊM THÀNH VIÊN VÀO SUBTEAMS (Đảm bảo mỗi team >= 2 người)
-- ==============================================
INSERT INTO SubTeamMembers (SubTeamID, EmployeeID) VALUES
-- 1. Backend Core (IT): Charlie (3), David (4) => 2 người
(1, 3), 
(1, 4), 

-- 2. Frontend UI (IT): David (4), Harry (8) => 2 người (both in Dept 3)
(2, 4), 
(2, 8),

-- 3. Talent Acquisition (HR): Bob (2), Eve (5) => 2 người
(3, 2), 
(3, 5),

(4, 9), 
(4, 10),
-- include team lead Bob (2) as member as well
(4, 2),

-- 5. Sales Force (Sales): Frank (6-Mới), Liam (11-Mới) => 2 người
(5, 6),
(5, 11),

-- 6. Finance Audit (Finance): Grace (7-Mới), Mia (12-Mới) => 2 người
(6, 7),
(6, 12),

(7, 13),
(7, 14),
-- include team lead Alice (1) as member
(7, 1);

-- ==============================================
-- 7. LOG HOẠT ĐỘNG ORGANIZATION
-- ==============================================
INSERT INTO OrganizationStructureLogs (EventType, TargetEntity, TargetID, EventData, PerformedBy, PerformedAt) VALUES
-- Bổ nhiệm Frank (ID 6) làm Manager phòng Sales (DeptID 4)
('ChangeDeptManager', 'Department', 4, JSON_OBJECT(
    'OldManagerID', NULL,
    'NewManagerID', 6,
    'NewManagerName', 'Frank Do',
    'Description', 'Appointed Frank as Sales Manager'
), 1, DATE_SUB(NOW(), INTERVAL 10 DAY)),

-- Bổ nhiệm Grace (ID 7) làm Manager phòng Finance (DeptID 5)
('ChangeDeptManager', 'Department', 5, JSON_OBJECT(
    'OldManagerID', NULL,
    'NewManagerID', 7,
    'NewManagerName', 'Grace Hoang',
    'Description', 'Appointed Grace as Finance Manager'
), 1, DATE_SUB(NOW(), INTERVAL 10 DAY));


-- --- GIAI ĐOẠN 2: THÀNH LẬP CÁC TEAM MỚI (Admin tạo SubTeam 5, 6, 7) ---
INSERT INTO OrganizationStructureLogs (EventType, TargetEntity, TargetID, EventData, PerformedBy, PerformedAt) VALUES
-- Tạo Sales Force Team (ID 5)
('CreateSubTeam', 'SubTeam', 5, JSON_OBJECT(
    'TeamName', 'Sales Force',
    'DepartmentID', 4,
    'DepartmentCode', 'SALE',
    'LeadID', 6
), 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- Tạo Finance Audit Team (ID 6)
('CreateSubTeam', 'SubTeam', 6, JSON_OBJECT(
    'TeamName', 'Finance Audit',
    'DepartmentID', 5,
    'DepartmentCode', 'FIN',
    'LeadID', 7
), 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- Tạo Strategic Board Team (ID 7)
('CreateSubTeam', 'SubTeam', 7, JSON_OBJECT(
    'TeamName', 'Strategic Board',
    'DepartmentID', 1,
    'DepartmentCode', 'BOD',
    'LeadID', 1
), 1, DATE_SUB(NOW(), INTERVAL 5 DAY));


-- --- GIAI ĐOẠN 3: PHÂN BỔ NHÂN SỰ VÀO TEAM (HR Bob thực hiện điều chuyển) ---
INSERT INTO OrganizationStructureLogs (EventType, TargetEntity, TargetID, EventData, PerformedBy, PerformedAt) VALUES
-- Thêm Harry (ID 8) vào Frontend UI (SubTeam 2)
('AssignToSubTeam', 'Employee', 8, JSON_OBJECT(
    'SubTeamID', 2,
    'SubTeamName', 'Frontend UI',
    'Role', 'Member',
    'ManagerID', 1
), 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Thêm Ivy (ID 9) vào C&B Team (SubTeam 4)
('AssignToSubTeam', 'Employee', 9, JSON_OBJECT(
    'SubTeamID', 4,
    'SubTeamName', 'C&B Team',
    'Role', 'Member',
    'ManagerID', 2
), 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Thêm Jack (ID 10) vào C&B Team (SubTeam 4)
('AssignToSubTeam', 'Employee', 10, JSON_OBJECT(
    'SubTeamID', 4,
    'SubTeamName', 'C&B Team',
    'Role', 'Member',
    'ManagerID', 2
), 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Thêm Liam (ID 11) vào Sales Force (SubTeam 5)
('AssignToSubTeam', 'Employee', 11, JSON_OBJECT(
    'SubTeamID', 5,
    'SubTeamName', 'Sales Force',
    'Role', 'Member',
    'ManagerID', 6
), 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Thêm Mia (ID 12) vào Finance Audit (SubTeam 6)
('AssignToSubTeam', 'Employee', 12, JSON_OBJECT(
    'SubTeamID', 6,
    'SubTeamName', 'Finance Audit',
    'Role', 'Member',
    'ManagerID', 7
), 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Thêm Kevin (ID 13) vào Strategic Board (SubTeam 7)
('AssignToSubTeam', 'Employee', 13, JSON_OBJECT(
    'SubTeamID', 7,
    'SubTeamName', 'Strategic Board',
    'Role', 'Assistant',
    'ManagerID', 1
), 1, DATE_SUB(NOW(), INTERVAL 1 DAY)), -- Alice tự thêm trợ lý cho mình

-- Thêm Laura (ID 14) vào Strategic Board (SubTeam 7)
('AssignToSubTeam', 'Employee', 14, JSON_OBJECT(
    'SubTeamID', 7,
    'SubTeamName', 'Strategic Board',
    'Role', 'Assistant',
    'ManagerID', 1
), 1, NOW());
;

Select*from EmployeeEvents;
