using Dapper;
using HRM.Api.DTOs;
using MySqlConnector;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using HRM.Api.Data;
using HRM.Api.Models;
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
                SELECT 
                    d.DepartmentID, 
                    d.DepartmentName, 
                    d.DepartmentCode,
                    d.Description,  -- <--- THÊM DÒNG NÀY
                    d.ManagerID,    -- <--- THÊM DÒNG NÀY
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
                SELECT 
                    e.EmployeeID, 
                    CONCAT(e.FirstName, ' ', e.LastName) as Name, 
                    'Staff' as Position,
                    e.AvatarUrl as Avatar,
                    d.DepartmentName
                FROM Employees e
                LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
                WHERE e.IsActive = 1";
             
             using var conn = CreateConnection();
             return await conn.QueryAsync<EmployeeSimpleDto>(sql);
        }
        
        public async Task<IEnumerable<EmployeeSimpleDto>> GetSubordinatesAsync(int managerId)
        {
             const string sql = @"
                SELECT 
                    e.EmployeeID, 
                    CONCAT(e.FirstName, ' ', e.LastName) as Name, 
                    'Staff' as Position,
                    e.AvatarUrl as Avatar,
                    d.DepartmentName
                FROM Employees e
                LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
                WHERE e.ManagerID = @managerId AND e.IsActive = 1";
             
             using var conn = CreateConnection();
             return await conn.QueryAsync<EmployeeSimpleDto>(sql, new { managerId });
        }

        // ==========================================
        // RESTORED METHODS (EF Core Implementation)
        // ==========================================

        public async Task<OrganizationStructureDto> GetStructureAsync()
        {
            // 1. Lấy CEO (Giả định ID = 1)
            var ceo = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeID == 1);

            // 2. Lấy toàn bộ dữ liệu lồng nhau
            var departments = await _context.Departments
                .Include(d => d.Manager)
                .Include(d => d.SubTeams)
                    .ThenInclude(st => st.TeamLead)
                .Include(d => d.SubTeams)
                    .ThenInclude(st => st.SubTeamMembers)
                        .ThenInclude(stm => stm.Employee)
                .ToListAsync();

            // 3. Lấy nhân viên chưa có Team
            var assignedIds = await _context.SubTeamMembers.Select(x => x.EmployeeID).ToListAsync();
            var unassigned = await _context.Employees
                .Where(e => !assignedIds.Contains(e.EmployeeID) && e.IsActive)
                .Select(e => new EmployeeSimpleDto
                {
                    EmployeeID = e.EmployeeID,
                    Name = $"{e.FirstName} {e.LastName}",
                    Position = "Employee",
                    Avatar = e.AvatarUrl
                }).ToListAsync();

            // 4. Map dữ liệu
            var deptDtos = departments.Select(d => new DepartmentHierarchyDto
            {
                Id = d.DepartmentID,
                Name = d.DepartmentName,
                Description = d.Description,
                Manager = d.Manager != null ? $"{d.Manager.FirstName} {d.Manager.LastName}" : "N/A",
                ManagerId = d.ManagerID?.ToString(),
                Teams = d.SubTeams.Select(t => new TeamDto
                {
                    SubTeamID = t.SubTeamID,
                    TeamName = t.TeamName,
                    Description = t.Description,
                    TeamLeadName = t.TeamLead != null ? $"{t.TeamLead.FirstName} {t.TeamLead.LastName}" : "N/A",
                    TeamLeadID = t.TeamLeadID,
                    Members = t.SubTeamMembers.Select(m => new TeamMemberDto // Wait, TeamDto has 'Members' of type TeamMemberDto?
                    // In Step 1275 TeamDto has: public List<TeamMemberDto> Members { get; set; }
                    // TeamMemberDto has EmployeeID, FirstName, LastName...
                    // My existing code was mapping to EmployeeSimpleDto!
                    {
                        EmployeeID = m.Employee.EmployeeID,
                        FirstName = m.Employee.FirstName,
                        LastName = m.Employee.LastName,
                        AvatarUrl = m.Employee.AvatarUrl,
                        Position = "Member"
                    }).ToList()
                }).ToList()
            }).ToList();

            return new OrganizationStructureDto
            {
                Company = new CompanyInfoDto { Name = "Global Tech Inc", Ceo = ceo != null ? $"{ceo.FirstName} {ceo.LastName}" : "Unknown" },
                Departments = deptDtos,
                UnassignedEmployees = unassigned
            };
        }

        public async Task<bool> DepartmentNameExistsAsync(string name)
        {
            return await _context.Departments.AnyAsync(d => d.DepartmentName == name);
        }

        public async Task<bool> DepartmentCodeExistsAsync(string code)
        {
            return await _context.Departments.AnyAsync(d => d.DepartmentCode == code);
        }

        public async Task<Department> AddDepartmentAsync(Department department)
        {
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            
            // Logic: Nếu Department có Manager, update Employee đó về Department
            if (department.ManagerID.HasValue)
            {
                var emp = await _context.Employees.FindAsync(department.ManagerID.Value);
                if (emp != null)
                {
                    emp.DepartmentID = department.DepartmentID;
                    _context.Employees.Update(emp);
                    await _context.SaveChangesAsync();
                }
            }
            return department;
        }

        public async Task<Department?> GetDepartmentByIdAsync(int id)
        {
            return await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == id);
        }

        public async Task<bool> HasEmployeesOrTeamsAsync(int departmentId)
        {
            var hasEmployees = await _context.Employees.AnyAsync(e => e.DepartmentID == departmentId);
            var hasTeams = await _context.SubTeams.AnyAsync(st => st.DepartmentID == departmentId);
            return hasEmployees || hasTeams;
        }

        public async Task DeleteDepartmentAsync(Department department)
        {
            // Logic xóa an toàn: Gỡ Manager -> Gỡ Employee -> Xóa SubTeams -> Xóa Department
            department.ManagerID = null;
            _context.Departments.Update(department);
            await _context.SaveChangesAsync();

            var employees = await _context.Employees.Where(e => e.DepartmentID == department.DepartmentID).ToListAsync();
            foreach (var emp in employees) { emp.DepartmentID = null; }
            _context.Employees.UpdateRange(employees);
            await _context.SaveChangesAsync();

            var subTeams = await _context.SubTeams.Where(st => st.DepartmentID == department.DepartmentID).ToListAsync();
            _context.SubTeams.RemoveRange(subTeams);
            await _context.SaveChangesAsync();

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
        }

        public async Task<SubTeam?> GetSubTeamByIdAsync(int id)
        {
            return await _context.SubTeams.FindAsync(id);
        }

        public async Task<bool> SubTeamHasMembersAsync(int subTeamId)
        {
            return await _context.SubTeamMembers.AnyAsync(stm => stm.SubTeamID == subTeamId);
        }

        public async Task UpdateTeamAsync(SubTeam team)
        {
            // Use direct SQL to avoid EF tracking issues
            const string sql = "UPDATE SubTeams SET TeamLeadID = NULL WHERE SubTeamID = @SubTeamID";
            using var conn = CreateConnection();
            await conn.ExecuteAsync(sql, new { SubTeamID = team.SubTeamID });
        }


        public async Task DeleteSubTeamAsync(SubTeam subTeam)
        {
            _context.SubTeams.Remove(subTeam);
            await _context.SaveChangesAsync();
        }

        // New methods for safe team deletion
        public async Task<List<SubTeamMember>> GetTeamMembersAsync(int teamId)
        {
            return await _context.SubTeamMembers
                .Where(stm => stm.SubTeamID == teamId)
                .ToListAsync();
        }

        public async Task<bool> IsEmployeeInAnyTeamAsync(int employeeId)
        {
            return await _context.SubTeamMembers
                .AnyAsync(stm => stm.EmployeeID == employeeId);
        }

        public async Task UpdateEmployeeDepartmentAsync(int employeeId, int? departmentId)
        {
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee != null)
            {
                employee.DepartmentID = departmentId;
                _context.Employees.Update(employee);
                await _context.SaveChangesAsync();
            }
        }

        public async Task RemoveAllTeamMembersAsync(int teamId)
        {
            var members = await _context.SubTeamMembers
                .Where(stm => stm.SubTeamID == teamId)
                .ToListAsync();
            
            _context.SubTeamMembers.RemoveRange(members);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateDepartmentAsync(int id, UpdateDepartmentDto department, int userId)
        {
            using var conn = CreateConnection();

            // 1. LẤY DỮ LIỆU CŨ
            var oldSql = "SELECT * FROM Departments WHERE DepartmentID = @Id";
            var oldDept = await conn.QuerySingleOrDefaultAsync<UpdateDepartmentDto>(oldSql, new { Id = id });

            if (oldDept == null) return;

            // 2. XỬ LÝ DỮ LIỆU (SỬA ĐOẠN NÀY)
            
            // Tên và Code: Nếu chuỗi rỗng/null thì giữ cái cũ, ngược lại lấy cái mới
            var newName = !string.IsNullOrWhiteSpace(department.DepartmentName) ? department.DepartmentName : oldDept.DepartmentName;
            var newCode = !string.IsNullOrWhiteSpace(department.DepartmentCode) ? department.DepartmentCode : oldDept.DepartmentCode;
            var newDesc = department.Description ?? oldDept.Description;

            // LOGIC CŨ (SAI): var newManagerId = (department.ManagerID.HasValue && department.ManagerID.Value > 0) ? ... : ...;
            
            // LOGIC MỚI (ĐÚNG): Luôn lấy giá trị từ Frontend gửi lên (kể cả NULL)
            // Frontend gửi NULL tức là muốn gỡ Manager -> Database lưu NULL
            // Frontend gửi ID tức là muốn đổi Manager -> Database lưu ID
            var newManagerId = department.ManagerID; 

            // 3. UPDATE
            const string updateSql = @"
                UPDATE Departments 
                SET DepartmentName = @DepartmentName,
                    DepartmentCode = @DepartmentCode,
                    Description = @Description,
                    ManagerID = @ManagerID
                WHERE DepartmentID = @Id";

            await conn.ExecuteAsync(updateSql, new { 
                DepartmentName = newName,
                DepartmentCode = newCode,
                Description = newDesc,
                ManagerID = newManagerId, // Truyền trực tiếp giá trị (int? hoặc null)
                Id = id 
            });
        }

        public async Task AddLogAsync(OrganizationLogDto log)
        {
            const string sql = @"
                INSERT INTO OrganizationStructureLogs 
                (EventType, TargetEntity, TargetID, EventData, PerformedBy, PerformedAt)
                VALUES 
                (@EventType, @TargetEntity, @TargetID, @EventData, @PerformedBy, @PerformedAt)";

            using var conn = CreateConnection();
            await conn.ExecuteAsync(sql, log);
        }

        public async Task<IEnumerable<OrganizationLogDto>> GetOrganizationLogsAsync()
        {
            const string sql = @"
                SELECT 
                    l.LogID,
                    l.EventType,
                    l.TargetEntity,
                    l.TargetID,
                    l.EventData,
                    l.PerformedBy,
                    CONCAT(e.FirstName, ' ', e.LastName) as PerformedByName,
                    l.PerformedAt
                FROM OrganizationStructureLogs l
                LEFT JOIN Employees e ON l.PerformedBy = e.EmployeeID
                ORDER BY l.PerformedAt DESC";

            using var conn = CreateConnection();
            return await conn.QueryAsync<OrganizationLogDto>(sql);
        }
    }
}