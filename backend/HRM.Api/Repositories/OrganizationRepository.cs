using Dapper;
using HRM.Api.DTOs;
using MySqlConnector;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using HRM.Api.Models;
using HRM.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace HRM.Api.Repositories
{
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly string _connectionString;

        private readonly AppDbContext _context;

        public OrganizationRepository(IConfiguration configuration, AppDbContext context)
        {
            // Đảm bảo trong appsettings.json của bạn có chuỗi kết nối tên "DefaultConnection"
            _connectionString = configuration.GetConnectionString("DefaultConnection");

            _context = context;
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

        public async Task<Department> AddDepartmentAsync(Department department)
        {
            // Giờ _context đã có giá trị, code này sẽ chạy ngon lành
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            // Tự động chuyển Manager về phòng ban mới (nếu có chọn Manager)
            if (department.ManagerID.HasValue)
            {
                var employee = await _context.Employees.FindAsync(department.ManagerID.Value);
                if (employee != null)
                {
                    employee.DepartmentID = department.DepartmentID;
                    _context.Employees.Update(employee);
                    await _context.SaveChangesAsync();
                }
            }
            return department;
        }

        public async Task DeleteDepartmentAsync(Department department)
        {
            // 1. Gỡ Manager ra trước
            department.ManagerID = null;
            _context.Departments.Update(department);
            await _context.SaveChangesAsync();

            // 2. Gỡ nhân viên về Unassigned
            var employees = await _context.Employees
                .Where(e => e.DepartmentID == department.DepartmentID)
                .ToListAsync();

            if (employees.Any())
            {
                foreach (var emp in employees) emp.DepartmentID = null;
                _context.Employees.UpdateRange(employees);
                await _context.SaveChangesAsync();
            }

            // 3. Xóa các Team con
            var subTeams = await _context.SubTeams
                .Where(st => st.DepartmentID == department.DepartmentID)
                .ToListAsync();
            if (subTeams.Any())
            {
                _context.SubTeams.RemoveRange(subTeams);
                await _context.SaveChangesAsync();
            }

            // 4. Xóa Phòng ban
            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
        }

        // --- CÁC HÀM HỖ TRỢ KHÁC (Cần thiết cho Controller gọi) ---
        public async Task<Department?> GetDepartmentByIdAsync(int id)
        {
            return await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == id);
        }

        // Các hàm check trùng (Dùng EF Core cho lẹ)
        public async Task<bool> DepartmentNameExistsAsync(string name)
        {
            return await _context.Departments.AnyAsync(d => d.DepartmentName == name);
        }

        public async Task<bool> DepartmentCodeExistsAsync(string code)
        {
            return await _context.Departments.AnyAsync(d => d.DepartmentCode == code);
        }
    }
}