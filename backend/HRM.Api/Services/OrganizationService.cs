using HRM.Api.DTOs;
using HRM.Api.Repositories;
using HRM.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;

namespace HRM.Api.Services
{
    public class OrganizationService : IOrganizationService
    {
        private readonly IOrganizationRepository _repository;

        public OrganizationService(IOrganizationRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync()
        {
            return await _repository.GetDepartmentsAsync();
        }

        public async Task<IEnumerable<TeamDto>> GetAllTeamsWithMembersAsync()
        {
            // 1. Lấy tất cả team từ DB
            var teams = (await _repository.GetTeamsRawAsync()).ToList();

            // 2. Lấy tất cả thành viên của các team
            var members = await _repository.GetTeamMembersRawAsync();

            // 3. LOGIC GHÉP: Phân chia member vào đúng team của họ
            foreach (var team in teams)
            {
                team.Members = members
                    .Where(m => m.SubTeamID == team.SubTeamID)
                    .ToList();
            }

            return teams;
        }

        public async Task<IEnumerable<EmployeeSimpleDto>> GetAllEmployeesAsync()
        {
            return await _repository.GetAllEmployeesAsync();
        }

        // ==========================================
        // RESTORED METHODS
        // ==========================================

        public async Task<OrganizationStructureDto> GetStructureAsync()
        {
            return await _repository.GetStructureAsync();
        }

        public async Task<(bool Success, string Message, object? Data)> AddDepartmentAsync(CreateDepartmentDto dto)
        {
            // 1. Validate
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                return (false, "Name and Department Code are required.", null);
            }

            // 2. Check trùng tên
            if (await _repository.DepartmentNameExistsAsync(dto.Name))
            {
                return (false, "Department name already exists.", null);
            }

            // 3. Check trùng code
            if (await _repository.DepartmentCodeExistsAsync(dto.DepartmentCode))
            {
                return (false, "Department code already exists.", null);
            }

            // 4. Tạo Entity
            var newDept = new Department
            {
                DepartmentName = dto.Name,
                DepartmentCode = dto.DepartmentCode,
                Description = dto.Description ?? "",
                ManagerID = dto.ManagerId
            };

            try
            {
                var createdDept = await _repository.AddDepartmentAsync(newDept);

                var responseData = new
                {
                    id = createdDept.DepartmentID,
                    name = createdDept.DepartmentName,
                    departmentCode = createdDept.DepartmentCode,
                    managerId = createdDept.ManagerID,
                    description = createdDept.Description
                };

                return (true, "Department created successfully", responseData);
            }
            catch (Exception ex)
            {
                return (false, $"Internal Error: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> DeleteDepartmentAsync(int id)
        {
            var dept = await _repository.GetDepartmentByIdAsync(id);
            if (dept == null)
            {
                return (false, "Department not found."); 
            }

            try
            {
                await _repository.DeleteDepartmentAsync(dept);
                return (true, "Department deleted successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Internal Error: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message, int? TeamId)> DeleteTeamAsync(int id)
        {
            var team = await _repository.GetSubTeamByIdAsync(id);
            if (team == null)
            {
                return (false, "Team not found.", null);
            }

            try
            {
                // 1. Get all members BEFORE deleting (to know who to update)
                var members = await _repository.GetTeamMembersAsync(id);
                var employeeIds = members.Select(m => m.EmployeeID).ToList();
                
                // 2. Delete OrganizationStructureLogs for this team (FK constraint)
                await _repository.DeleteTeamLogsAsync(id);
                
                // 3. Clear TeamLeadID to avoid FK constraint issues
                if (team.TeamLeadID.HasValue)
                {
                    team.TeamLeadID = null;
                    await _repository.UpdateTeamAsync(team);
                }
                
                // 4. Delete the team (CASCADE will auto-delete SubTeamMembers)
                await _repository.DeleteSubTeamAsync(team);
                
                // 5. Now update each employee's department if they're not in any other team
                foreach (var employeeId in employeeIds)
                {
                    bool stillInATeam = await _repository.IsEmployeeInAnyTeamAsync(employeeId);
                    
                    if (!stillInATeam)
                    {
                        // Employee is no longer in any team, so clear their department
                        await _repository.UpdateEmployeeDepartmentAsync(employeeId, null);
                    }
                    // If still in a team, keep their DepartmentID as is
                }
                
                return (true, "Team deleted successfully", id);
            }
            catch (Exception ex)
            {
                return (false, $"Internal Error: {ex.Message}", null);
            }
        }

        private async Task LogActionAsync(string eventType, string entity, int targetId, object data, int userId)
        {
            var logEntry = new OrganizationLogDto
            {
                EventType = eventType,
                TargetEntity = entity,
                TargetID = targetId,
                EventData = data != null ? JsonSerializer.Serialize(data) : "{}",
                PerformedBy = userId,
                PerformedAt = DateTime.Now
            };
            await _repository.AddLogAsync(logEntry);
        }

        public async Task UpdateDepartmentAsync(int id, UpdateDepartmentDto request, int userId)
        {
            // 1. LẤY DỮ LIỆU CŨ (Hiện có trong DB)
            var oldDept = await _repository.GetDepartmentByIdAsync(id);
            
            // Nếu không tìm thấy phòng ban thì thôi, hoặc throw exception tùy bạn
            if (oldDept == null) return; 

            // 2. TÍNH TOÁN SỰ THAY ĐỔI (DIFF LOGIC)
            var changes = new List<object>();

            // --- So sánh Tên Phòng Ban ---
            // Logic giống Repository: Chỉ update nếu chuỗi không rỗng
            if (!string.IsNullOrWhiteSpace(request.DepartmentName) && request.DepartmentName != oldDept.DepartmentName)
            {
                changes.Add(new 
                { 
                    Field = "DepartmentName", 
                    OldValue = oldDept.DepartmentName, 
                    NewValue = request.DepartmentName 
                });
            }

            // --- So sánh Mã Phòng Ban ---
            if (!string.IsNullOrWhiteSpace(request.DepartmentCode) && request.DepartmentCode != oldDept.DepartmentCode)
            {
                changes.Add(new 
                { 
                    Field = "DepartmentCode", 
                    OldValue = oldDept.DepartmentCode, 
                    NewValue = request.DepartmentCode 
                });
            }

            // --- So sánh Description ---
            // Description cho phép null hoặc rỗng để cập nhật
            if (request.Description != null && request.Description != oldDept.Description)
            {
                changes.Add(new 
                { 
                    Field = "Description", 
                    OldValue = oldDept.Description, 
                    NewValue = request.Description 
                });
            }

            // --- So sánh ManagerID (QUAN TRỌNG) ---
            // ManagerID có thể là null (khi chọn None)
            if (request.ManagerID != oldDept.ManagerID)
            {
                changes.Add(new 
                { 
                    Field = "ManagerID", 
                    OldValue = oldDept.ManagerID, 
                    NewValue = request.ManagerID 
                });
            }

            // 3. GỌI REPO ĐỂ UPDATE VÀO DB
            await _repository.UpdateDepartmentAsync(id, request, userId);

            // 4. LƯU LOG (Chỉ lưu nếu có thay đổi thực sự)
            if (changes.Count > 0)
            {
                // LogActionAsync sẽ serialize cái list 'changes' thành JSON
                await LogActionAsync("UpdateDepartment", "Department", id, changes, userId);
            }
        }

        public async Task<IEnumerable<OrganizationLogDto>> GetOrganizationLogsAsync()
        {
            return await _repository.GetOrganizationLogsAsync();
        }
    }
}