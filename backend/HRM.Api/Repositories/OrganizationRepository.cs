using HRM.Api.Data;
using HRM.Api.DTOs.Organization;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public class OrganizationRepository : IOrganizationRepository
    {
        private readonly AppDbContext _context;

        public OrganizationRepository(AppDbContext context)
        {
            _context = context;
        }

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
                    Id = e.EmployeeID.ToString(),
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
                    Id = t.SubTeamID,
                    Name = t.TeamName,
                    Description = t.Description,
                    Lead = t.TeamLead != null ? $"{t.TeamLead.FirstName} {t.TeamLead.LastName}" : "N/A",
                    LeadId = t.TeamLeadID?.ToString(),
                    Employees = t.SubTeamMembers.Select(m => new EmployeeSimpleDto
                    {
                        Id = m.Employee.EmployeeID.ToString(),
                        Name = $"{m.Employee.FirstName} {m.Employee.LastName}",
                        Position = "Member",
                        Avatar = m.Employee.AvatarUrl
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
            // 1. Lưu phòng ban trước để có ID
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            // 2. --- THÊM ĐOẠN NÀY ---
            // Nếu phòng ban có Manager, tự động chuyển nhân viên đó về phòng ban này
            if (department.ManagerID.HasValue)
            {
                var employee = await _context.Employees.FindAsync(department.ManagerID.Value);
                if (employee != null)
                {
                    // Cập nhật DepartmentID cho nhân viên
                    employee.DepartmentID = department.DepartmentID;
                    _context.Employees.Update(employee);

                    // Lưu thay đổi lần 2
                    await _context.SaveChangesAsync();
                }
            }
            // ------------------------

            return department;
        }

        public async Task<Department?> GetDepartmentByIdAsync(int id)
        {
            return await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == id);
        }

        public async Task<bool> HasEmployeesOrTeamsAsync(int departmentId)
        {
            // Kiểm tra xem có nhân viên nào thuộc phòng ban này không
            bool hasEmployees = await _context.Employees.AnyAsync(e => e.DepartmentID == departmentId);
            // Kiểm tra xem có subteam nào thuộc phòng ban này không
            bool hasTeams = await _context.SubTeams.AnyAsync(st => st.DepartmentID == departmentId);

            return hasEmployees || hasTeams;
        }

        public async Task DeleteDepartmentAsync(Department department)
        {
            // BƯỚC 1: Gỡ Manager ra khỏi phòng ban trước (Cắt đứt quan hệ Manager)
            // Điều này cực kỳ quan trọng để tránh lỗi vòng lặp khóa ngoại
            department.ManagerID = null;
            _context.Departments.Update(department);
            await _context.SaveChangesAsync(); // <--- Lưu lần 1

            // BƯỚC 2: Gỡ tất cả nhân viên ra khỏi phòng ban (Set DepartmentID = null)
            var employees = await _context.Employees
                .Where(e => e.DepartmentID == department.DepartmentID)
                .ToListAsync();

            if (employees.Any())
            {
                foreach (var emp in employees)
                {
                    emp.DepartmentID = null;
                }
                _context.Employees.UpdateRange(employees);
                await _context.SaveChangesAsync(); // <--- Lưu lần 2
            }

            // BƯỚC 3: Xóa các Team con (SubTeams)
            var subTeams = await _context.SubTeams
                .Where(st => st.DepartmentID == department.DepartmentID)
                .ToListAsync();

            if (subTeams.Any())
            {
                _context.SubTeams.RemoveRange(subTeams);
                await _context.SaveChangesAsync(); // <--- Lưu lần 3
            }

            // BƯỚC 4: Cuối cùng mới xóa cái vỏ Phòng ban
            _context.Departments.Remove(department);
            await _context.SaveChangesAsync(); // <--- Lưu lần cuối (Chốt đơn)
        }

        public async Task<SubTeam?> GetSubTeamByIdAsync(int id)
        {
            return await _context.SubTeams.FindAsync(id);
        }

        public async Task<bool> SubTeamHasMembersAsync(int subTeamId)
        {
            return await _context.SubTeamMembers.AnyAsync(stm => stm.SubTeamID == subTeamId);
        }

        public async Task DeleteSubTeamAsync(SubTeam subTeam)
        {
            _context.SubTeams.Remove(subTeam);
            await _context.SaveChangesAsync();
        }
    }
}