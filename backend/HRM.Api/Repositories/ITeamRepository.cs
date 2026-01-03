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
        /// Update an existing sub-team
        /// </summary>
        Task UpdateSubTeamAsync(SubTeam subTeam);

        /// <summary>
        /// Log team update action
        /// </summary>
        Task LogTeamUpdateAsync(int teamId, string oldTeamName, string newTeamName, string oldDescription, string newDescription, int? oldTeamLeadId, int? newTeamLeadId, int performedBy);

        /// <summary>
        /// Log employee removal action to OrganizationStructureLogs
        /// </summary>
        Task LogRemoveEmployeeActionAsync(int employeeId, int teamId, int departmentId, string employeeName, string teamName, int performedBy);

        /// <summary>
        /// Log team creation action to OrganizationStructureLogs
        /// </summary>
        Task LogTeamCreationAsync(int teamId, string teamName, string description, int departmentId, string departmentCode, int? teamLeadId, int performedBy);

        /// <summary>
        /// Move an employee from their current team (if any) to target team atomically and log the action
        /// </summary>
        Task<(bool Success, string Message)> MoveEmployeeAsync(int employeeId, int targetTeamId, int performedBy);
    }
}
