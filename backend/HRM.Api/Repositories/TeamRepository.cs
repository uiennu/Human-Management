using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HRM.Api.Repositories
{
    public class TeamRepository : Repository<SubTeam>, ITeamRepository
    {
        public TeamRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<SubTeam> AddSubTeamAsync(SubTeam subTeam)
        {
            _context.SubTeams.Add(subTeam);
            await _context.SaveChangesAsync();
            return subTeam;
        }

        public async Task<SubTeam?> GetTeamByIdAsync(int teamId)
        {
            return await _context.SubTeams
                .Include(st => st.Department)
                .Include(st => st.TeamLead)
                .Include(st => st.SubTeamMembers)
                .FirstOrDefaultAsync(st => st.SubTeamID == teamId);
        }

        public async Task<SubTeamMember?> GetTeamMemberAsync(int employeeId)
        {
            return await _context.SubTeamMembers
                .Include(stm => stm.SubTeam)
                .FirstOrDefaultAsync(stm => stm.EmployeeID == employeeId);
        }

        public async Task<bool> IsEmployeeInTeamAsync(int employeeId)
        {
            return await _context.SubTeamMembers
                .AnyAsync(stm => stm.EmployeeID == employeeId);
        }

        public async Task<Employee?> GetEmployeeByIdAsync(int employeeId)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.EmployeeID == employeeId);
        }

        public async Task<List<SubTeam>> GetAllTeamsAsync()
        {
            return await _context.SubTeams
                .Include(st => st.Department)
                .Include(st => st.TeamLead)
                .Include(st => st.SubTeamMembers)
                    .ThenInclude(stm => stm.Employee)
                        .ThenInclude(e => e.Department)
                .OrderBy(st => st.TeamName)
                .ToListAsync();
        }

        public async Task<List<Employee>> GetUnassignedEmployeesAsync()
        {
            var assignedEmployeeIds = await _context.SubTeamMembers
                .Select(m => m.EmployeeID)
                .Distinct()
                .ToListAsync();

            return await _context.Employees
                .Where(e => !assignedEmployeeIds.Contains(e.EmployeeID))
                .ToListAsync();
        }

        public async Task<List<Role>> GetAllRolesAsync()
        {
            return await _context.Roles.ToListAsync();
        }

        public async Task<List<Department>> GetAllDepartmentsAsync()
        {
            return await _context.Departments.ToListAsync();
        }

        public async Task<List<Employee>> GetManagersAsync()
        {
            // Find roles that contain "Manager"
            var managerRoleIds = await _context.Roles
                .Where(r => r.RoleName.Contains("Manager"))
                .Select(r => r.RoleID)
                .ToListAsync();

            if (!managerRoleIds.Any())
                return new List<Employee>();

            var managerEmployeeIds = await _context.EmployeeRoles
                .Where(er => managerRoleIds.Contains(er.RoleID))
                .Select(er => er.EmployeeID)
                .Distinct()
                .ToListAsync();

            return await _context.Employees
                .Where(e => managerEmployeeIds.Contains(e.EmployeeID))
                .ToListAsync();
        }

        public async Task<List<Employee>> GetAllEmployeesAsync()
        {
            return await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.EmployeeRoles)
                .ThenInclude(er => er.Role)
                .ToListAsync();
        }

        public async Task AddTeamMemberAsync(SubTeamMember teamMember)
        {
            await _context.SubTeamMembers.AddAsync(teamMember);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveTeamMemberAsync(SubTeamMember teamMember)
        {
            _context.SubTeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();
        }

        public async Task LogRemoveEmployeeActionAsync(int employeeId, int teamId, int departmentId, string employeeName, string teamName, int performedBy)
        {
            var eventData = new
            {
                EmployeeID = employeeId,
                EmployeeName = employeeName,
                SubTeamID = teamId,
                SubTeamName = teamName,
                DepartmentID = departmentId,
                OldSubTeamID = teamId,      // Employee was in this team
                NewSubTeamID = (int?)null,  // Now not in any team
                Description = $"Removed {employeeName} from team {teamName}"
            };

            var sql = @"
                INSERT INTO OrganizationStructureLogs 
                (EventType, TargetEntity, TargetID, EventData, PerformedBy, PerformedAt) 
                VALUES 
                (@EventType, @TargetEntity, @TargetID, @EventData, @PerformedBy, @PerformedAt)";

            await _context.Database.ExecuteSqlRawAsync(sql,
                new MySqlConnector.MySqlParameter("@EventType", "RemoveEmployeeFromTeam"),
                new MySqlConnector.MySqlParameter("@TargetEntity", "Employee"),
                new MySqlConnector.MySqlParameter("@TargetID", employeeId),
                new MySqlConnector.MySqlParameter("@EventData", JsonSerializer.Serialize(eventData)),
                new MySqlConnector.MySqlParameter("@PerformedBy", performedBy),
                new MySqlConnector.MySqlParameter("@PerformedAt", DateTime.Now)
            );
        }

        public async Task LogTeamCreationAsync(int teamId, string teamName, string description, int departmentId, string departmentCode, int? teamLeadId, int performedBy)
        {
            var eventData = new
            {
                TeamName = teamName,
                Description = description,
                DepartmentID = departmentId,
                DepartmentCode = departmentCode,
                TeamLeadID = teamLeadId
            };

            var sql = @"
                INSERT INTO OrganizationStructureLogs 
                (EventType, TargetEntity, TargetID, EventData, PerformedBy, PerformedAt) 
                VALUES 
                (@EventType, @TargetEntity, @TargetID, @EventData, @PerformedBy, @PerformedAt)";

            await _context.Database.ExecuteSqlRawAsync(sql,
                new MySqlConnector.MySqlParameter("@EventType", "CreateSubTeam"),
                new MySqlConnector.MySqlParameter("@TargetEntity", "SubTeam"),
                new MySqlConnector.MySqlParameter("@TargetID", teamId),
                new MySqlConnector.MySqlParameter("@EventData", JsonSerializer.Serialize(eventData)),
                new MySqlConnector.MySqlParameter("@PerformedBy", performedBy),
                new MySqlConnector.MySqlParameter("@PerformedAt", DateTime.Now)
            );
        }
    }
}
