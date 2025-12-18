using HRM.Api.DTOs.Organization;
using HRM.Api.Models;

namespace HRM.Api.Repositories
{
    public interface IOrganizationRepository
    {
        Task<OrganizationStructureDto> GetStructureAsync();

        Task<bool> DepartmentNameExistsAsync(string name);
        Task<bool> DepartmentCodeExistsAsync(string code);
        Task<Department> AddDepartmentAsync(Department department);
        Task<Department?> GetDepartmentByIdAsync(int id);
        Task<bool> HasEmployeesOrTeamsAsync(int departmentId);
        Task DeleteDepartmentAsync(Department department);
        Task<SubTeam?> GetSubTeamByIdAsync(int id);
        Task<bool> SubTeamHasMembersAsync(int subTeamId);
        Task DeleteSubTeamAsync(SubTeam subTeam);
    }
}