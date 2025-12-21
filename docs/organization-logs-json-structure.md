# Organization Logs - JSON Event Data Structure

## Overview

Bảng `OrganizationStructureLogs` sử dụng JSON format để lưu trữ chi tiết thay đổi. Dưới đây là cấu trúc JSON cho từng loại event.

---

## Event Types

### 1. CreateSubTeam
**Mô tả**: Tạo team mới  
**TargetEntity**: `SubTeam`  
**TargetID**: `SubTeamID` của team mới tạo

**JSON Structure**:
```json
{
  "TeamName": "Sales Force",
  "Description": "Direct Sales Team",
  "DepartmentID": 4,
  "DepartmentCode": "SALE",
  "TeamLeadID": 6
}
```

**Backend Implementation**: ✅ Done in `TeamRepository.LogTeamCreationAsync()`

---

### 2. UpdateSubTeam
**Mô tả**: Sửa thông tin team (tên, mô tả, etc.)  
**TargetEntity**: `SubTeam`  
**TargetID**: `SubTeamID` của team được sửa

**JSON Structure**:
```json
{
  "OldTeamName": "Sales Team",
  "NewTeamName": "Sales Force",
  "OldDescription": "Old desc",
  "NewDescription": "New desc",
  "OldTeamLeadID": 5,
  "NewTeamLeadID": 6,
  "DepartmentID": 4
}
```

**Backend Implementation**: ❌ TODO

---

### 3. RemoveEmployeeFromTeam
**Mô tả**: Xóa nhân viên khỏi team  
**TargetEntity**: `Employee`  
**TargetID**: `EmployeeID` của nhân viên bị xóa

**JSON Structure**:
```json
{
  "EmployeeID": 8,
  "EmployeeName": "Harry Vu",
  "SubTeamID": 2,
  "SubTeamName": "Frontend UI",
  "DepartmentID": 3,
  "OldSubTeamID": 2,
  "NewSubTeamID": null,
  "Description": "Removed Harry Vu from team Frontend UI"
}
```

**Backend Implementation**: ✅ Done in `TeamRepository.LogRemoveEmployeeActionAsync()`

---

### 4. AddEmployeeToTeam
**Mô tả**: Thêm nhân viên vào team  
**TargetEntity**: `Employee`  
**TargetID**: `EmployeeID` của nhân viên được thêm

**JSON Structure**:
```json
{
  "EmployeeID": 8,
  "EmployeeName": "Harry Vu",
  "SubTeamID": 2,
  "SubTeamName": "Frontend UI",
  "DepartmentID": 3,
  "OldSubTeamID": null,
  "NewSubTeamID": 2,
  "Description": "Added Harry Vu to team Frontend UI"
}
```

**Backend Implementation**: ❌ TODO

---

### 5. MoveEmployeeToTeam
**Mô tả**: Chuyển nhân viên từ team này sang team khác  
**TargetEntity**: `Employee`  
**TargetID**: `EmployeeID` của nhân viên được chuyển

**JSON Structure**:
```json
{
  "EmployeeID": 8,
  "EmployeeName": "Harry Vu",
  "OldSubTeamID": 1,
  "OldSubTeamName": "Backend Core",
  "NewSubTeamID": 2,
  "NewSubTeamName": "Frontend UI",
  "OldDepartmentID": 3,
  "NewDepartmentID": 3,
  "Description": "Moved Harry Vu from Backend Core to Frontend UI"
}
```

**Backend Implementation**: ❌ TODO

---

### 6. ChangeDeptManager
**Mô tả**: Thay đổi manager của department  
**TargetEntity**: `Department`  
**TargetID**: `DepartmentID` của department

**JSON Structure**:
```json
{
  "OldManagerID": null,
  "NewManagerID": 6,
  "NewManagerName": "Frank Do",
  "DepartmentID": 4,
  "DepartmentName": "Sales & Marketing",
  "Description": "Appointed Frank as Sales Manager"
}
```

**Backend Implementation**: ❌ TODO

---

### 7. ChangeTeamLead
**Mô tả**: Thay đổi team lead của team  
**TargetEntity**: `SubTeam`  
**TargetID**: `SubTeamID` của team

**JSON Structure**:
```json
{
  "SubTeamID": 5,
  "TeamName": "Sales Force",
  "OldTeamLeadID": 5,
  "OldTeamLeadName": "John Doe",
  "NewTeamLeadID": 6,
  "NewTeamLeadName": "Frank Do",
  "DepartmentID": 4,
  "Description": "Changed team lead from John Doe to Frank Do"
}
```

**Backend Implementation**: ❌ TODO

---

### 8. CreateDepartment
**Mô tả**: Tạo department mới  
**TargetEntity**: `Department`  
**TargetID**: `DepartmentID` của department mới

**JSON Structure**:
```json
{
  "DepartmentName": "Marketing",
  "DepartmentCode": "MKT",
  "Description": "Marketing and Communications",
  "ManagerID": 10
}
```

**Backend Implementation**: ❌ TODO

---

### 9. UpdateDepartment
**Mô tả**: Sửa thông tin department  
**TargetEntity**: `Department`  
**TargetID**: `DepartmentID` của department được sửa

**JSON Structure**:
```json
{
  "OldDepartmentName": "Sales",
  "NewDepartmentName": "Sales & Marketing",
  "OldDepartmentCode": "SAL",
  "NewDepartmentCode": "SALE",
  "OldDescription": "Old desc",
  "NewDescription": "New desc",
  "OldManagerID": 5,
  "NewManagerID": 6,
  "Changes": [
    {
      "Field": "DepartmentName",
      "OldValue": "Sales",
      "NewValue": "Sales & Marketing"
    }
  ]
}
```

**Backend Implementation**: ✅ Partially done in `OrganizationService.UpdateDepartmentAsync()` (uses `Changes` array)

---

### 10. DeleteDepartment
**Mô tả**: Xóa department  
**TargetEntity**: `Department`  
**TargetID**: `DepartmentID` của department bị xóa

**JSON Structure**:
```json
{
  "DepartmentID": 6,
  "DepartmentName": "Old Department",
  "DepartmentCode": "OLD",
  "ManagerID": 10,
  "Description": "Deleted department Old Department"
}
```

**Backend Implementation**: ❌ TODO

---

### 11. DeleteSubTeam
**Mô tả**: Xóa team  
**TargetEntity**: `SubTeam`  
**TargetID**: `SubTeamID` của team bị xóa

**JSON Structure**:
```json
{
  "SubTeamID": 8,
  "TeamName": "Old Team",
  "DepartmentID": 3,
  "DepartmentName": "IT Development",
  "TeamLeadID": 5,
  "MemberCount": 3,
  "Description": "Deleted team Old Team with 3 members"
}
```

**Backend Implementation**: ❌ TODO

---

## Query Examples

### Lấy tất cả logs của một employee
```sql
SELECT 
    LogID,
    EventType,
    TargetEntity,
    JSON_EXTRACT(EventData, '$.EmployeeName') as EmployeeName,
    JSON_EXTRACT(EventData, '$.Description') as Description,
    PerformedAt
FROM OrganizationStructureLogs
WHERE JSON_EXTRACT(EventData, '$.EmployeeID') = 8
ORDER BY PerformedAt DESC;
```

### Lấy tất cả thay đổi team lead
```sql
SELECT 
    LogID,
    EventType,
    JSON_EXTRACT(EventData, '$.TeamName') as TeamName,
    JSON_EXTRACT(EventData, '$.OldTeamLeadName') as OldLead,
    JSON_EXTRACT(EventData, '$.NewTeamLeadName') as NewLead,
    PerformedAt
FROM OrganizationStructureLogs
WHERE EventType = 'ChangeTeamLead'
ORDER BY PerformedAt DESC;
```

### Lấy tất cả employee movements (chuyển team)
```sql
SELECT 
    LogID,
    JSON_EXTRACT(EventData, '$.EmployeeName') as Employee,
    JSON_EXTRACT(EventData, '$.OldSubTeamName') as FromTeam,
    JSON_EXTRACT(EventData, '$.NewSubTeamName') as ToTeam,
    PerformedAt
FROM OrganizationStructureLogs
WHERE EventType IN ('MoveEmployeeToTeam', 'AddEmployeeToTeam', 'RemoveEmployeeFromTeam')
ORDER BY PerformedAt DESC;
```

### Lấy tất cả changes của một department
```sql
SELECT 
    LogID,
    EventType,
    JSON_PRETTY(EventData) as Changes,
    PerformedBy,
    PerformedAt
FROM OrganizationStructureLogs
WHERE TargetEntity = 'Department' 
  AND TargetID = 4
ORDER BY PerformedAt DESC;
```

---

## Implementation Checklist

- [x] CreateSubTeam
- [x] RemoveEmployeeFromTeam (updated with OldSubTeamID/NewSubTeamID)
- [x] UpdateDepartment (uses Changes array)
- [ ] UpdateSubTeam
- [ ] AddEmployeeToTeam
- [ ] MoveEmployeeToTeam
- [ ] ChangeDeptManager
- [ ] ChangeTeamLead
- [ ] CreateDepartment
- [ ] DeleteDepartment
- [ ] DeleteSubTeam

---

## Notes

> [!TIP]
> Khi implement các event mới, luôn include các trường `Old*` và `New*` để dễ dàng track changes và có thể rollback nếu cần.

> [!IMPORTANT]
> Đối với các trường nullable (như `TeamLeadID`, `ManagerID`), sử dụng `(int?)null` trong C# để serialize thành `null` trong JSON thay vì `0`.
