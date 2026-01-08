using HRM.Api.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRM.Api.Services
{
    public interface ITeamService
    {
        /// <summary>
        /// Add an employee to a team
        /// </summary>
        /// <returns>Tuple with (Success, Message, EmployeeId)</returns>
        Task<(bool Success, string Message, int? EmployeeId)> AddEmployeeToTeamAsync(int teamId, int employeeId, int userId);

        /// <summary>
        /// Remove an employee from a team
        /// </summary>
        /// <returns>Tuple with (Success, Message, Data)</returns>
        Task<(bool Success, string Message, RemoveEmployeeDataDto? Data)> RemoveEmployeeFromTeamAsync(int teamId, int employeeId, int userId);

        /// <summary>
        /// Get all teams with members
        /// </summary>
        Task<List<TeamResponseDto>> GetAllTeamsAsync();

        /// <summary>
        /// Get list of employees not assigned to any team
        /// </summary>
        Task<List<int>> GetUnassignedEmployeesAsync();

        /// <summary>
        /// Get all roles
        /// </summary>
        Task<List<RoleDto>> GetAllRolesAsync();

        /// <summary>
        /// Get all departments
        /// </summary>
        Task<List<DepartmentDto>> GetAllDepartmentsAsync();

        /// <summary>
        /// Get all managers
        /// </summary>
        Task<List<ManagerDto>> GetManagersAsync();

        /// <summary>
        /// Get all employees with details
        /// </summary>
        Task<List<EmployeeListDto>> GetAllEmployeesAsync();
        /// <summary>
        /// Create a new team in a department
        /// </summary>
        Task<(bool Success, string Message, int? TeamId)> CreateTeamAsync(int departmentId, CreateSubTeamDto dto, int userId);
        /// <summary>
        /// Update an existing team
        /// </summary>
        Task<(bool Success, string Message)> UpdateTeamAsync(int teamId, UpdateSubTeamDto dto, int userId);

        /// <summary>
        /// Move an employee from their current team (if any) to a target team (atomic)
        /// </summary>
        Task<(bool Success, string Message)> MoveEmployeeAsync(int employeeId, int targetTeamId, int userId);
    }
}
