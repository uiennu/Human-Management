using Dapper;
using HRM.Api.DTOs;
using MySqlConnector;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace HRM.Api.Repositories
{
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly string _connectionString;

        public OrganizationRepository(IConfiguration configuration)
        {
            // Đảm bảo trong appsettings.json của bạn có chuỗi kết nối tên "DefaultConnection"
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        private IDbConnection CreateConnection() => new MySqlConnection(_connectionString);

        public async Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync()
        {
            const string sql = @"
                SELECT d.DepartmentID, d.DepartmentName, d.DepartmentCode,
                       CONCAT(e.FirstName, ' ', e.LastName) AS ManagerName
                FROM Departments d
                LEFT JOIN Employees e ON d.ManagerID = e.EmployeeID";

            using var conn = CreateConnection();
            return await conn.QueryAsync<DepartmentDto>(sql);
        }

        public async Task<IEnumerable<TeamDto>> GetTeamsRawAsync()
        {
            const string sql = @"
                SELECT st.SubTeamID, st.TeamName, st.Description, st.DepartmentID,
                       st.TeamLeadID, CONCAT(l.FirstName, ' ', l.LastName) AS TeamLeadName
                FROM SubTeams st
                LEFT JOIN Employees l ON st.TeamLeadID = l.EmployeeID";

            using var conn = CreateConnection();
            return await conn.QueryAsync<TeamDto>(sql);
        }

        public async Task<IEnumerable<TeamMemberDto>> GetTeamMembersRawAsync()
        {
            const string sql = @"
                SELECT stm.SubTeamID, e.EmployeeID, e.FirstName, e.LastName, 
                       e.AvatarUrl, r.RoleName AS Position
                FROM SubTeamMembers stm
                JOIN Employees e ON stm.EmployeeID = e.EmployeeID
                LEFT JOIN EmployeeRoles er ON e.EmployeeID = er.EmployeeID
                LEFT JOIN Roles r ON er.RoleID = r.RoleID";

            using var conn = CreateConnection();
            return await conn.QueryAsync<TeamMemberDto>(sql);
        }

        public async Task<IEnumerable<EmployeeSimpleDto>> GetAllEmployeesAsync()
        {
             const string sql = @"
                SELECT EmployeeID, CONCAT(FirstName, ' ', LastName) as Name, 'Staff' as Position 
                FROM Employees WHERE IsActive = 1";
             
             using var conn = CreateConnection();
             return await conn.QueryAsync<EmployeeSimpleDto>(sql);
        }
    }
}