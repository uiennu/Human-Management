using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public interface ILeaveRequestRepository : IRepository<LeaveRequest>
    {
        Task<LeaveRequest?> GetByIdWithDetailsAsync(int id);
        Task<List<LeaveRequest>> GetByEmployeeIdAsync(int employeeId);
        Task<PagedResult<LeaveRequest>> GetPagedAsync(int employeeId, string? status, string? dateRange, int? leaveTypeId, int page, int pageSize);
        Task<List<LeaveType>> GetLeaveTypesAsync();
    }

    public class LeaveRequestRepository : Repository<LeaveRequest>, ILeaveRequestRepository
    {
        public LeaveRequestRepository(AppDbContext context) : base(context) { }

        public async Task<List<LeaveType>> GetLeaveTypesAsync()
        {
            return await _context.Set<LeaveType>().ToListAsync();
        }

        public async Task<LeaveRequest?> GetByIdWithDetailsAsync(int id)
        {
            return await _dbSet
                .Include(x => x.LeaveType)
                .Include(x => x.Employee)
                .FirstOrDefaultAsync(x => x.LeaveRequestID == id);
        }

        public async Task<List<LeaveRequest>> GetByEmployeeIdAsync(int employeeId)
        {
            return await _dbSet
                .Where(x => x.EmployeeID == employeeId)
                .Include(x => x.LeaveType)
                .OrderByDescending(x => x.RequestedDate)
                .ToListAsync();
        }

        public async Task<PagedResult<LeaveRequest>> GetPagedAsync(int employeeId, string? status, string? dateRange, int? leaveTypeId, int page, int pageSize)
        {
            var query = _dbSet
                .Where(x => x.EmployeeID == employeeId)
                .Include(x => x.LeaveType)
                .AsQueryable();

            // Filter by Status
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(x => x.Status == status);
            }

            // Filter by Leave Type
            if (leaveTypeId.HasValue && leaveTypeId.Value > 0)
            {
                query = query.Where(x => x.LeaveTypeID == leaveTypeId.Value);
            }

            // Filter by Date Range
            if (!string.IsNullOrEmpty(dateRange))
            {
                var today = DateTime.Today;
                switch (dateRange)
                {
                    case "last-7-days":
                        var last7 = today.AddDays(-7);
                        query = query.Where(x => x.StartDate >= last7);
                        break;
                    case "last-30-days":
                        var last30 = today.AddDays(-30);
                        query = query.Where(x => x.StartDate >= last30);
                        break;
                    case "last-90-days":
                        var last90 = today.AddDays(-90);
                        query = query.Where(x => x.StartDate >= last90);
                        break;
                    case "this-year":
                        var startOfYear = new DateTime(today.Year, 1, 1);
                        query = query.Where(x => x.StartDate >= startOfYear);
                        break;
                    case "all-time":
                        // No filter
                        break;
                }
            }

            var totalItems = await query.CountAsync();
            var items = await query
                .OrderByDescending(x => x.RequestedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<LeaveRequest>
            {
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                CurrentPage = page,
                Items = items
            };
        }
    }

    public class PagedResult<T>
    {
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public List<T> Items { get; set; } = new();
    }
}
