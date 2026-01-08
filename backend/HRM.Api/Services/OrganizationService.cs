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

        public async Task<IEnumerable<EmployeeSimpleDto>> GetSubordinatesAsync(int managerId)
        {
            return await _repository.GetSubordinatesAsync(managerId);
        }

        // ==========================================
        // RESTORED METHODS
        // ==========================================

        public async Task<OrganizationStructureDto> GetStructureAsync()
        {
            return await _repository.GetStructureAsync();
        }

        public async Task<(bool Success, string Message, object? Data)> AddDepartmentAsync(CreateDepartmentDto dto, int userId)
        {
            // 1. Validate dữ liệu đầu vào
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.DepartmentCode))
                return (false, "Name and Department Code are required.", null);

            // 2. Check trùng Tên và Code
            if (await _repository.DepartmentNameExistsAsync(dto.Name))
                return (false, "Department name already exists.", null);

            if (await _repository.DepartmentCodeExistsAsync(dto.DepartmentCode))
                return (false, "Department code already exists.", null);

            // 3. Check Manager (đảm bảo Manager chưa thuộc Dept khác)
            if (dto.ManagerId.HasValue)
            {
                var manager = await _repository.GetEmployeeByIdAsync(dto.ManagerId.Value);
                if (manager != null && manager.DepartmentID.HasValue)
                {
                    return (false, $"Employee '{manager.FirstName} {manager.LastName}' is already assigned to another department.", null);
                }
            }

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

                // --- GHI LOG SAU KHI TẠO THÀNH CÔNG ---
                await LogActionAsync("CreateDepartment", "Department", createdDept.DepartmentID, new
                {
                    Name = createdDept.DepartmentName,
                    Code = createdDept.DepartmentCode,
                    ManagerID = createdDept.ManagerID
                }, userId);

                var responseData = new
                {
                    id = createdDept.DepartmentID,
                    name = createdDept.DepartmentName,
                    departmentCode = createdDept.DepartmentCode
                };

                return (true, "Department created successfully", responseData);
            }
            catch (Exception ex)
            {
                return (false, $"Internal Error: {ex.Message}", null);
            }
        }

        public async Task<(bool Success, string Message)> DeleteDepartmentAsync(int id, int userId)
        {
            var dept = await _repository.GetDepartmentByIdAsync(id);
            if (dept == null) return (false, "Department not found.");

            // Lưu thông tin cũ để ghi vào log
            var logData = new { Name = dept.DepartmentName, Code = dept.DepartmentCode };

            try
            {
                // Gọi Repo để thực hiện xóa (Repo đã xử lý việc gỡ nhân viên, xóa subteam)
                await _repository.DeleteDepartmentAsync(dept);

                // --- GHI LOG ---
                await LogActionAsync("DeleteDepartment", "Department", id, logData, userId);

                return (true, "Department deleted successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Internal Error: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message, int? TeamId)> DeleteTeamAsync(int id, int userId)
        {
            var team = await _repository.GetSubTeamByIdAsync(id);
            if (team == null) return (false, "Team not found.", null);

            var logData = new { Name = team.TeamName, DeptID = team.DepartmentID };

            try
            {
                var result = await _repository.DeleteTeamAsync(id); 

                if (result.Success)
                {
                    // --- GHI LOG ---
                    await LogActionAsync("DeleteSubTeam", "SubTeam", id, logData, userId);
                }
                return result;
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
            var oldDept = await _repository.GetDepartmentByIdAsync(id);
            if (oldDept == null) return;

            var changes = new List<object>();

            // Logic so sánh thay đổi để log chi tiết
            if (!string.IsNullOrWhiteSpace(request.DepartmentName) && request.DepartmentName != oldDept.DepartmentName)
                changes.Add(new { Field = "DepartmentName", Old = oldDept.DepartmentName, New = request.DepartmentName });

            if (!string.IsNullOrWhiteSpace(request.DepartmentCode) && request.DepartmentCode != oldDept.DepartmentCode)
                changes.Add(new { Field = "DepartmentCode", Old = oldDept.DepartmentCode, New = request.DepartmentCode });

            if (request.ManagerID != oldDept.ManagerID)
                changes.Add(new { Field = "ManagerID", Old = oldDept.ManagerID, New = request.ManagerID });

            await _repository.UpdateDepartmentAsync(id, request, userId);

            if (changes.Count > 0)
            {
                await LogActionAsync("UpdateDepartment", "Department", id, changes, userId);
            }
        }

        public async Task<IEnumerable<OrganizationLogDto>> GetOrganizationLogsAsync()
        {
            return await _repository.GetOrganizationLogsAsync();
        }

        // Trong OrganizationService.cs

        // Trong file OrganizationService.cs

        // File: HRM.Api.Services/OrganizationService.cs

// 1. Cập nhật tham số nhận vào
        public async Task<(bool Success, string Message)> MoveEmployeeAsync(int employeeId, int targetTeamId, int userId)
        {
            try 
            {
                var targetTeam = await _repository.GetSubTeamByIdAsync(targetTeamId);
                if (targetTeam == null) return (false, "Target team not found");

                // Lấy thông tin nhân viên TRƯỚC khi di chuyển để ghi log cho đẹp (Optional)
                var emp = await _repository.GetEmployeeByIdAsync(employeeId);
                string empName = emp != null ? $"{emp.FirstName} {emp.LastName}" : $"ID {employeeId}";

                // Thực hiện logic di chuyển
                await _repository.MoveEmployeeToTeamAsync(employeeId, targetTeamId);
                await _repository.UpdateEmployeeDepartmentAsync(employeeId, targetTeam.DepartmentID);

                // 2. GHI LOG VỚI USER ID CHÍNH CHỦ
                var logData = new 
                { 
                    Employee = empName, 
                    ToTeam = targetTeam.TeamName,
                    ToDeptID = targetTeam.DepartmentID
                };

                await LogActionAsync("MoveEmployee", "Employee", employeeId, logData, userId);

                return (true, "Employee moved successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Error: {ex.Message}");
            }
        }
    }
}