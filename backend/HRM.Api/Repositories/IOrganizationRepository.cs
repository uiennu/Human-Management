using HRM.Api.DTOs;
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
    }
}