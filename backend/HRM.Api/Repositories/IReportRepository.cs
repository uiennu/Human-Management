// Repositories/IReportRepository.cs
using HRM.Api.DTOs.Reports;
using Microsoft.EntityFrameworkCore;
using HRM.Api.Data; // Giả sử đây là nơi chứa DbContext
public interface IReportRepository
{
    Task<(List<EmployeeReportItemDto> Items, int TotalCount)> GetEmployeeReportDataAsync(
        EmployeeReportRequestDto filter, 
        int currentManagerId);
        
    Task<ReportSummaryDto> GetReportSummaryAsync(
        EmployeeReportRequestDto filter, 
        int currentManagerId);

      Task<List<string>> GetDepartmentNamesAsync();
}

// Repositories/ReportRepository.cs

 // Giả sử đây là nơi chứa DbContext

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

        // 1. Bắt đầu từ bảng Employees
        var query = _context.Employees.AsQueryable();

        // 2. Logic Filter "Department"
        if (filter.Department == "All under me")
        {
            // Đệ quy hoặc đơn giản là cấp dưới trực tiếp (tuỳ business logic)
            // Ở đây ví dụ lấy cấp dưới trực tiếp hoặc gián tiếp theo Department Manager
            query = query.Where(e => e.ManagerID == currentManagerId || 
                                     e.Department.ManagerID == currentManagerId);
        }
        else if (!string.IsNullOrEmpty(filter.Department))
        {
            var filterDept = filter.Department.Trim();
            query = query.Where(e => e.Department.DepartmentName == filter.Department);
        }

        // 3. Logic Search (Name or ID)
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            string search = filter.SearchTerm.ToLower();
            query = query.Where(e => (e.FirstName + " " + e.LastName).ToLower().Contains(search) || 
                                     e.EmployeeID.ToString().Contains(search));
        }

        // 4. Logic Hire Date
        if (filter.HireDateFrom.HasValue)
            query = query.Where(e => e.HireDate >= filter.HireDateFrom.Value);
        
        if (filter.HireDateTo.HasValue)
            query = query.Where(e => e.HireDate <= filter.HireDateTo.Value);

        // 5. Projection & Trạng thái phức tạp (Active / On Leave / Terminated)
        // Lưu ý: Cần join Left với LeaveRequests để check "On Leave"
        var projectedQuery = query.Select(e => new 
        {
            e.EmployeeID,
            FullName = e.FirstName + " " + e.LastName,
            DepartmentName = e.Department.DepartmentName,
            e.HireDate,
            e.IsActive,
            e.AvatarUrl,
            // Logic check OnLeave: Có request nào Approved và bao trùm ngày hôm nay không
            IsOnLeave = _context.LeaveRequests.Any(lr => 
                lr.EmployeeID == e.EmployeeID && 
                lr.Status == "Approved" && 
                lr.StartDate <= today && 
                lr.EndDate >= today),
            // Giả sử RoleName là Position, lấy role đầu tiên
            Position = e.EmployeeRoles.Select(er => er.Role.RoleName).FirstOrDefault() ?? "Staff"
        })
        .Select(x => new EmployeeReportItemDto
        {
            EmployeeId = "EMP" + x.EmployeeID.ToString("D3"), // Format EMP001
            FullName = x.FullName,
            Department = x.DepartmentName,
            HireDate = x.HireDate,
            Position = x.Position,
            AvatarUrl = x.AvatarUrl,
            // Mapping Status cuối cùng
            Status = !x.IsActive ? "Terminated" : (x.IsOnLeave ? "On Leave" : "Active")
        });

        // 6. Filter by Calculated Status
        if (filter.SelectedStatuses != null && filter.SelectedStatuses.Any())
        {
            projectedQuery = projectedQuery.Where(x => filter.SelectedStatuses.Contains(x.Status));
        }

        return projectedQuery;
    }


    public async Task<(List<EmployeeReportItemDto> Items, int TotalCount)> GetEmployeeReportDataAsync(
        EmployeeReportRequestDto filter, int currentManagerId)
    {
        var query = BuildBaseQuery(filter, currentManagerId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.HireDate)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<ReportSummaryDto> GetReportSummaryAsync(
        EmployeeReportRequestDto filter, int currentManagerId)
    {
        // Để tính Summary chính xác, ta dùng query gốc (không phân trang) 
        // nhưng BỎ filter Status (vì biểu đồ tròn thường hiện tổng quan active/inactive/leave)
        // Tuy nhiên theo logic UI, biểu đồ thay đổi theo filter Department/Date.
        
        // Clone filter và clear status để đếm toàn bộ
        var summaryFilter = new EmployeeReportRequestDto 
        { 
            Department = filter.Department,
            SearchTerm = filter.SearchTerm,
            HireDateFrom = filter.HireDateFrom,
            HireDateTo = filter.HireDateTo,
            SelectedStatuses = null // Clear status filter for summary
        };

        var query = BuildBaseQuery(summaryFilter, currentManagerId);

        // Group by Status và Count (Thực hiện trên Memory nếu EF không dịch được GroupBy phức tạp, 
        // hoặc query 3 lần count cho an toàn SQL)
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
        // Lấy danh sách tên phòng ban, loại bỏ trùng lặp
        return await _context.Departments
                             .Select(d => d.DepartmentName)
                             .Distinct()
                             .ToListAsync();
    }
}