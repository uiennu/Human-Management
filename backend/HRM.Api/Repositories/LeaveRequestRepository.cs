using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public interface ILeaveRequestRepository : IRepository<LeaveRequest>
    {
        Task<LeaveRequest?> GetByIdWithDetailsAsync(int id);
        Task<List<LeaveRequest>> GetByEmployeeIdAsync(int employeeId);
        Task<PagedResult<LeaveRequest>> GetPagedAsync(int employeeId, string? status, int page, int pageSize);
    }

    public class LeaveRequestRepository : Repository<LeaveRequest>, ILeaveRequestRepository
    {
        public LeaveRequestRepository(AppDbContext context) : base(context) { }

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

        public async Task<PagedResult<LeaveRequest>> GetPagedAsync(int employeeId, string? status, int page, int pageSize)
        {
            var query = _dbSet
                .Where(x => x.EmployeeID == employeeId)
                .Include(x => x.LeaveType)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(x => x.Status == status);
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
