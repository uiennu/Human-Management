using HRM.Api.DTOs.Organization;
using HRM.Api.Repositories;
using HRM.Api.Models;

namespace HRM.Api.Services
{
    public class OrganizationService : IOrganizationService
    {
        private readonly IOrganizationRepository _repo;

        public OrganizationService(IOrganizationRepository repo)
        {
            _repo = repo;
        }

        public Task<OrganizationStructureDto> GetStructureAsync()
        {
            return _repo.GetStructureAsync();
        }

        public async Task<(bool Success, string Message, object? Data)> AddDepartmentAsync(CreateDepartmentDto dto)
        {
            // 1. Validate
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.DepartmentCode))
            {
                return (false, "Name and Department Code are required.", null);
            }

            // 2. Check trùng tên
            if (await _repo.DepartmentNameExistsAsync(dto.Name))
            {
                return (false, "Department name already exists.", null);
            }

            // 3. Check trùng code
            if (await _repo.DepartmentCodeExistsAsync(dto.DepartmentCode))
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
                var createdDept = await _repo.AddDepartmentAsync(newDept);

                // 5. Trả về kết quả (Đã bỏ isActive)
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
            var dept = await _repo.GetDepartmentByIdAsync(id);
            if (dept == null)
            {
                return (false, "Department not found."); // Map 404 ở Controller
            }

            try
            {
                await _repo.DeleteDepartmentAsync(dept);
                return (true, "Department deleted successfully");
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return (false, $"Internal Error: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message, int? TeamId)> DeleteTeamAsync(int id)
        {
            var team = await _repo.GetSubTeamByIdAsync(id);
            if (team == null)
            {
                return (false, "Team not found.", null);
            }

            bool hasMembers = await _repo.SubTeamHasMembersAsync(id);
            if (hasMembers)
            {
                return (false, "Conflict: Team currently has members.", null);
            }

            try
            {
                await _repo.DeleteSubTeamAsync(team);
                return (true, "Team deleted successfully", id);
            }
            catch (Exception ex)
            {
                return (false, $"Internal Error: {ex.Message}", null);
            }
        }
    }
}