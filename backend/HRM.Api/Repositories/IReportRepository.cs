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
      Task<List<string>> GetSubTeamNamesAsync(string departmentName, int managerId);
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

        // --- BƯỚC 1: LẤY THÔNG TIN NGƯỜI DÙNG ĐỂ CHECK QUYỀN ---
        var currentUser = _context.Employees
            .Include(e => e.EmployeeRoles).ThenInclude(er => er.Role)
            .FirstOrDefault(e => e.EmployeeID == currentManagerId);

        // Kiểm tra xem người này có phải là Admin không
        bool isAdmin = currentUser != null && currentUser.EmployeeRoles.Any(er => er.Role.RoleName == "Admin"||er.Role.RoleName == "HR Employee"||er.Role.RoleName == "HR Manager"||er.Role.RoleName == "BOD Assistant");

        // --- BƯỚC 2: KHỞI TẠO QUERY ---
        var query = _context.Employees.Include(e => e.Department).AsQueryable();

        // =================================================================
        // PHẦN LỌC DỮ LIỆU (FILTER)
        // =================================================================

        // 3. Logic Filter "Department"
        if (filter.Department == "All under me" || string.IsNullOrEmpty(filter.Department))
        {
            // LOGIC MỚI SỬA:
            // Nếu KHÔNG PHẢI ADMIN (tức là Manager các phòng ban), bắt buộc lọc theo DepartmentID của họ
            if (!isAdmin && currentUser?.DepartmentID != null)
            {
                query = query.Where(e => e.DepartmentID == currentUser.DepartmentID);
            }
            // Nếu là Admin thì kệ, không lọc gì cả => Lấy hết toàn công ty
        }
        else
        {
            // Nếu chọn phòng cụ thể (Admin chọn xem phòng khác)
            var filterDept = filter.Department.Trim().ToLower();
            query = query.Where(e => e.Department.DepartmentName.ToLower() == filterDept);
        }

        // 4. Logic Filter "SubTeam"
        if (!string.IsNullOrEmpty(filter.SubTeam) && filter.SubTeam != "All Teams")
        {
            var targetTeam = filter.SubTeam.Trim().ToLower();
            
            query = query.Where(e => _context.SubTeamMembers.Any(stm => 
                stm.EmployeeID == e.EmployeeID && 
                stm.SubTeam.TeamName.ToLower() == targetTeam
            ));
        }

        // 5. Logic Search (Name or ID)
        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            string search = filter.SearchTerm.ToLower().Trim();
            query = query.Where(e => (e.FirstName + " " + e.LastName).ToLower().Contains(search) || 
                                    e.EmployeeID.ToString().Contains(search));
        }

        // 6. Logic Hire Date
        if (filter.HireDateFrom.HasValue)
            query = query.Where(e => e.HireDate >= filter.HireDateFrom.Value);
        
        if (filter.HireDateTo.HasValue)
            query = query.Where(e => e.HireDate <= filter.HireDateTo.Value);

        // =================================================================
        // PHẦN MAPPING DỮ LIỆU (PROJECTION)
        // =================================================================
        
        var projectedQuery = query.Select(e => new 
        {
            e.EmployeeID,
            FullName = e.FirstName + " " + e.LastName,
            DepartmentName = e.Department != null ? e.Department.DepartmentName : "N/A",
            e.HireDate,
            e.IsActive,
            e.AvatarUrl,
            // Check OnLeave
            IsOnLeave = _context.LeaveRequests.Any(lr => 
                lr.EmployeeID == e.EmployeeID && 
                lr.Status == "Approved" && 
                lr.StartDate <= today && 
                lr.EndDate >= today),
            // Lấy Position
            Position = e.EmployeeRoles.Any() 
                ? e.EmployeeRoles.Select(er => er.Role.RoleName).FirstOrDefault() 
                : "Staff"
        })
        .Select(x => new EmployeeReportItemDto
        {
            // Đã bỏ chữ EMP00, chỉ lấy số ID thuần túy
            EmployeeId = x.EmployeeID.ToString(),
            FullName = x.FullName,
            Department = x.DepartmentName,
            HireDate = x.HireDate,
            Position = x.Position,
            AvatarUrl = x.AvatarUrl,
            Status = !x.IsActive ? "Terminated" : (x.IsOnLeave ? "On Leave" : "Active")
        });

        // 7. Filter by Status (Làm cuối cùng vì Status là trường tính toán)
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
            SubTeam = filter.SubTeam,
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

    public async Task<List<string>> GetSubTeamNamesAsync(string departmentName, int managerId)
    {
        var query = _context.SubTeams.AsQueryable();

        // LOGIC THÔNG MINH:
        // Trường hợp 1: Frontend gửi tên phòng ban cụ thể (VD: "IT Development") -> Lọc theo tên đó.
        if (!string.IsNullOrEmpty(departmentName) && departmentName != "All under me")
        {
            query = query.Where(t => t.Department.DepartmentName == departmentName);
        }
        // Trường hợp 2: Frontend gửi "All under me" (hoặc rỗng) -> Tự tìm phòng của ông Manager này.
        else 
        {
            // Tìm phòng ban mà ông này đang làm Manager (hoặc đang thuộc về)
            var managerDeptId = await _context.Employees
                .Where(e => e.EmployeeID == managerId)
                .Select(e => e.DepartmentID)
                .FirstOrDefaultAsync();

            if (managerDeptId.HasValue)
            {
                query = query.Where(t => t.DepartmentID == managerDeptId.Value);
            }
        }

        return await query
            .Select(t => t.TeamName)
            .Distinct()
            .ToListAsync();
    }
}