using HRM.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using HRM.Api.Models;

namespace HRM.Api.Repositories
{
    public interface IOrganizationRepository
    {
        Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync();
        Task<IEnumerable<TeamDto>> GetTeamsRawAsync();
        Task<IEnumerable<TeamMemberDto>> GetTeamMembersRawAsync();
        Task<IEnumerable<EmployeeSimpleDto>> GetAllEmployeesAsync();
        // Check trùng tên/code
        Task<bool> DepartmentNameExistsAsync(string name);
        Task<bool> DepartmentCodeExistsAsync(string code);

        // Thêm
        Task<Department> AddDepartmentAsync(Department department);

        // Lấy thông tin & Xóa
        Task<Department?> GetDepartmentByIdAsync(int id);
        Task DeleteDepartmentAsync(Department department);
    }
}