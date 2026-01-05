using HRM.Api.Data;
using HRM.Api.DTOs.Reports;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HRM.Api.Repositories
{
    public class ReportRepository : IReportRepository
    {
        private readonly AppDbContext _context;

        public ReportRepository(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<EmployeeReportItemDto> BuildBaseQuery(EmployeeReportRequestDto filter, int currentManagerId)
        {
            var today = DateTime.Today;

            // 1. Lấy thông tin user hiện tại
            var currentUser = _context.Employees
                .Include(e => e.EmployeeRoles).ThenInclude(er => er.Role)
                .FirstOrDefault(e => e.EmployeeID == currentManagerId);

            bool isAdmin = currentUser != null && currentUser.EmployeeRoles.Any(er => 
                er.Role.RoleName == "Admin" || 
                er.Role.RoleName == "HR Employee" || 
                er.Role.RoleName == "HR Manager" || 
                er.Role.RoleName == "BOD Assistant");

            // 2. Query cơ bản
            var query = _context.Employees.Include(e => e.Department).AsQueryable();

            // 3. Filter Department
            if (filter.Department == "All under me" || string.IsNullOrEmpty(filter.Department))
            {
                if (!isAdmin && currentUser?.DepartmentID != null)
                {
                    query = query.Where(e => e.DepartmentID == currentUser.DepartmentID);
                }
            }
            else
            {
                var filterDept = filter.Department.Trim().ToLower();
                query = query.Where(e => e.Department.DepartmentName.ToLower() == filterDept);
            }

            // 4. Filter SubTeam
            if (!string.IsNullOrEmpty(filter.SubTeam) && filter.SubTeam != "All Teams")
            {
                var targetTeam = filter.SubTeam.Trim().ToLower();
                query = query.Where(e => _context.SubTeamMembers.Any(stm => 
                    stm.EmployeeID == e.EmployeeID && 
                    stm.SubTeam.TeamName.ToLower() == targetTeam
                ));
            }

            // 5. Search
            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                string search = filter.SearchTerm.ToLower().Trim();
                query = query.Where(e => (e.FirstName + " " + e.LastName).ToLower().Contains(search) || 
                                         e.EmployeeID.ToString().Contains(search));
            }

            // 6. Hire Date
            if (filter.HireDateFrom.HasValue)
                query = query.Where(e => e.HireDate >= filter.HireDateFrom.Value);
            
            if (filter.HireDateTo.HasValue)
                query = query.Where(e => e.HireDate <= filter.HireDateTo.Value);

            // Projection
            var projectedQuery = query.Select(e => new 
            {
                e.EmployeeID,
                FullName = e.FirstName + " " + e.LastName,
                DepartmentName = e.Department != null ? e.Department.DepartmentName : "N/A",
                e.HireDate,
                e.IsActive,
                e.AvatarUrl,
                IsOnLeave = _context.LeaveRequests.Any(lr => 
                    lr.EmployeeID == e.EmployeeID && 
                    lr.Status == "Approved" && 
                    lr.StartDate <= today && 
                    lr.EndDate >= today),
                Position = e.EmployeeRoles.Any() 
                    ? e.EmployeeRoles.Select(er => er.Role.RoleName).FirstOrDefault() 
                    : "Staff"
            })
            .Select(x => new EmployeeReportItemDto
            {
                EmployeeId = x.EmployeeID.ToString(),
                FullName = x.FullName,
                Department = x.DepartmentName,
                HireDate = x.HireDate,
                Position = x.Position,
                AvatarUrl = x.AvatarUrl,
                Status = !x.IsActive ? "Terminated" : (x.IsOnLeave ? "On Leave" : "Active")
            });

            // 7. Filter Status
            if (filter.SelectedStatuses != null && filter.SelectedStatuses.Any())
            {
                projectedQuery = projectedQuery.Where(x => filter.SelectedStatuses.Contains(x.Status));
            }

            return projectedQuery;
        }

        public async Task<(List<EmployeeReportItemDto> Items, int TotalCount)> GetEmployeeReportDataAsync(EmployeeReportRequestDto filter, int currentManagerId)
        {
            var query = BuildBaseQuery(filter, currentManagerId);
            var totalCount = await query.CountAsync();
            
            var items = await query
                .OrderBy(x => x.EmployeeId.Length)
                .ThenBy(x => x.EmployeeId)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<ReportSummaryDto> GetReportSummaryAsync(EmployeeReportRequestDto filter, int currentManagerId)
        {
            var summaryFilter = new EmployeeReportRequestDto 
            { 
                Department = filter.Department,
                SubTeam = filter.SubTeam,
                SearchTerm = filter.SearchTerm,
                HireDateFrom = filter.HireDateFrom,
                HireDateTo = filter.HireDateTo,
                SelectedStatuses = null 
            };

            var query = BuildBaseQuery(summaryFilter, currentManagerId);
            var data = await query.ToListAsync(); 

            return new ReportSummaryDto
            {
                TotalEmployees = data.Count,
                ActiveCount = data.Count(x => x.Status == "Active"),
                OnLeaveCount = data.Count(x => x.Status == "On Leave"),
                TerminatedCount = data.Count(x => x.Status == "Terminated")
            };
        }

        public async Task<List<string>> GetDepartmentNamesAsync()
        {
            return await _context.Departments
                                 .Select(d => d.DepartmentName)
                                 .Distinct()
                                 .ToListAsync();
        }

        public async Task<List<string>> GetSubTeamNamesAsync(string departmentName, int managerId)
        {
            var query = _context.SubTeams.AsQueryable();

            if (!string.IsNullOrEmpty(departmentName) && departmentName != "All under me")
            {
                query = query.Where(t => t.Department.DepartmentName == departmentName);
            }
            else 
            {
                var managerDeptId = await _context.Employees
                    .Where(e => e.EmployeeID == managerId)
                    .Select(e => e.DepartmentID)
                    .FirstOrDefaultAsync();

                if (managerDeptId.HasValue)
                {
                    query = query.Where(t => t.DepartmentID == managerDeptId.Value);
                }
            }

            return await query.Select(t => t.TeamName).Distinct().ToListAsync();
        }
    }
}