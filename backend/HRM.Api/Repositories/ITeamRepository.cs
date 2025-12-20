using HRM.Api.Models;

namespace HRM.Api.Repositories
{
    public interface ITeamRepository : IRepository<SubTeam>
    {
        /// <summary>
        /// Get team by ID with related data (members, department, team lead)
        /// </summary>
        Task<SubTeam?> GetTeamByIdAsync(int teamId);

        /// <summary>
        /// Get team member record for a specific employee
        /// </summary>
        Task<SubTeamMember?> GetTeamMemberAsync(int employeeId);

        /// <summary>
        /// Check if an employee is already in any team
        /// </summary>
        Task<bool> IsEmployeeInTeamAsync(int employeeId);

        /// <summary>
        /// Get employee by ID
        /// </summary>
        Task<Employee?> GetEmployeeByIdAsync(int employeeId);

        /// <summary>
        /// Get all teams with members
        /// </summary>
        Task<List<SubTeam>> GetAllTeamsAsync();

        /// <summary>
        /// Get all employees not assigned to any team
        /// </summary>
        Task<List<Employee>> GetUnassignedEmployeesAsync();

        /// <summary>
        /// Get all roles
        /// </summary>
        Task<List<Role>> GetAllRolesAsync();

        /// <summary>
        /// Get all departments
        /// </summary>
        Task<List<Department>> GetAllDepartmentsAsync();

        /// <summary>
        /// Get all employees with details
        /// </summary>
        Task<List<Employee>> GetAllEmployeesAsync();

        /// <summary>
        /// Get all employees with manager roles
        /// </summary>
        Task<List<Employee>> GetManagersAsync();

        /// <summary>
        /// Add employee to team
        /// </summary>
        Task AddTeamMemberAsync(SubTeamMember teamMember);

        /// <summary>
        /// Remove employee from team
        /// </summary>
        Task RemoveTeamMemberAsync(SubTeamMember teamMember);

        /// <summary>
        /// Add a new sub-team
        /// </summary>
        Task<SubTeam> AddSubTeamAsync(SubTeam subTeam);

        /// <summary>
        /// Log employee removal action to OrganizationStructureLogs
        /// </summary>
        Task LogRemoveEmployeeActionAsync(int employeeId, int teamId, int departmentId, string employeeName, string teamName, int performedBy);
    }
}
