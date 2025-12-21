using HRM.Api.DTOs;
using HRM.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRM.Api.Repositories
{
    public interface IOrganizationRepository
    {
        Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync();
        Task<IEnumerable<TeamDto>> GetTeamsRawAsync();
        Task<IEnumerable<TeamMemberDto>> GetTeamMembersRawAsync();
        Task<IEnumerable<EmployeeSimpleDto>> GetAllEmployeesAsync();

        // Restored Methods
        Task<OrganizationStructureDto> GetStructureAsync();
        Task<bool> DepartmentNameExistsAsync(string name);
        Task<bool> DepartmentCodeExistsAsync(string code);
        Task<Department> AddDepartmentAsync(Department department);
        Task<Department?> GetDepartmentByIdAsync(int id);
        Task<bool> HasEmployeesOrTeamsAsync(int departmentId);
        Task DeleteDepartmentAsync(Department department);
        Task<SubTeam?> GetSubTeamByIdAsync(int id);
        Task<bool> SubTeamHasMembersAsync(int subTeamId);
        Task UpdateTeamAsync(SubTeam team);
        Task DeleteTeamLogsAsync(int teamId);
        Task DeleteSubTeamAsync(SubTeam subTeam);
        
        // New methods for safe team deletion
        Task<List<SubTeamMember>> GetTeamMembersAsync(int teamId);
        Task<bool> IsEmployeeInAnyTeamAsync(int employeeId);
        Task UpdateEmployeeDepartmentAsync(int employeeId, int? departmentId);
        Task RemoveAllTeamMembersAsync(int teamId);
        Task UpdateDepartmentAsync(int id, UpdateDepartmentDto department, int userId);
        Task AddLogAsync(OrganizationLogDto log);
        Task<IEnumerable<OrganizationLogDto>> GetOrganizationLogsAsync();
    }
}