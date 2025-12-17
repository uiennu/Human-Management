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
                .Select(e => new EmployeeSimpleDto {
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
    }
}