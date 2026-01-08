using HRM.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRM.Api.Services
{
    public interface IOrganizationService
    {
        Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync();
        Task<IEnumerable<TeamDto>> GetAllTeamsWithMembersAsync();
        Task<IEnumerable<EmployeeSimpleDto>> GetAllEmployeesAsync();
        Task<IEnumerable<EmployeeSimpleDto>> GetSubordinatesAsync(int managerId);

        // Restored Methods
        Task<OrganizationStructureDto> GetStructureAsync();
        Task<(bool Success, string Message, object? Data)> AddDepartmentAsync(CreateDepartmentDto dto, int userId);        
        Task<(bool Success, string Message)> DeleteDepartmentAsync(int id, int userId);
        Task<(bool Success, string Message, int? TeamId)> DeleteTeamAsync(int id, int userId);
        Task<(bool Success, string Message)> UpdateDepartmentAsync(int id, UpdateDepartmentDto request, int userId);
        Task<IEnumerable<OrganizationLogDto>> GetOrganizationLogsAsync();
        Task<(bool Success, string Message)> MoveEmployeeAsync(int employeeId, int targetTeamId,int userId);
    }
}