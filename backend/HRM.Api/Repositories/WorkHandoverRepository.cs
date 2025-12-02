using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public interface IWorkHandoverRepository : IRepository<WorkHandover>
    {
        Task<List<WorkHandover>> GetByLeaveRequestIdAsync(int leaveRequestId);
        Task<List<WorkHandover>> GetByEmployeeIdAsync(int employeeId);
        Task<WorkHandover?> GetByIdWithDetailsAsync(int id);
    }

    public class WorkHandoverRepository : Repository<WorkHandover>, IWorkHandoverRepository
    {
        public WorkHandoverRepository(AppDbContext context) : base(context) { }

        public async Task<List<WorkHandover>> GetByLeaveRequestIdAsync(int leaveRequestId)
        {
            return await _dbSet
                .Where(x => x.LeaveRequestID == leaveRequestId)
                .Include(x => x.AssigneeEmployee)
                .Include(x => x.Manager)
                .ToListAsync();
        }

        public async Task<List<WorkHandover>> GetByEmployeeIdAsync(int employeeId)
        {
            return await _dbSet
                .Where(x => x.AssigneeEmployeeID == employeeId || x.ManagerID == employeeId)
                .Include(x => x.LeaveRequest)
                .Include(x => x.AssigneeEmployee)
                .Include(x => x.Manager)
                .OrderByDescending(x => x.CreatedDate)
                .ToListAsync();
        }

        public async Task<WorkHandover?> GetByIdWithDetailsAsync(int id)
        {
            return await _dbSet
                .Include(x => x.LeaveRequest)
                .Include(x => x.AssigneeEmployee)
                .Include(x => x.Manager)
                .FirstOrDefaultAsync(x => x.HandoverID == id);
        }
    }
}
