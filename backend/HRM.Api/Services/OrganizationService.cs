using HRM.Api.DTOs;
using HRM.Api.Repositories;
using HRM.Api.Models;
using System;
using HRM.Api.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

            // Logic check member could be added here if not handled by Repo
            bool hasMembers = await _repository.SubTeamHasMembersAsync(id);
            if (hasMembers)
            {
                 return (false, "Conflict: Team currently has members.", null);
            }

            try
            {
                await _repository.DeleteSubTeamAsync(team);
                return (true, "Team deleted successfully", id);
            }
            catch (Exception ex)
            {
                return (false, $"Internal Error: {ex.Message}", null);
            }
        }
    }
}