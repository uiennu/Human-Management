using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public interface ILeaveBalanceRepository : IRepository<EmployeeLeaveBalance>
    {
        Task<List<EmployeeLeaveBalance>> GetByEmployeeIdAsync(int employeeId);
        Task<EmployeeLeaveBalance?> GetByEmployeeAndLeaveTypeAsync(int employeeId, int leaveTypeId);
    }

    public class LeaveBalanceRepository : Repository<EmployeeLeaveBalance>, ILeaveBalanceRepository
    {
        public LeaveBalanceRepository(AppDbContext context) : base(context) { }

        public async Task<List<EmployeeLeaveBalance>> GetByEmployeeIdAsync(int employeeId)
        {
            return await _dbSet
                .Where(x => x.EmployeeID == employeeId)
                .Include(x => x.LeaveType)
                .ToListAsync();
        }

        public async Task<EmployeeLeaveBalance?> GetByEmployeeAndLeaveTypeAsync(int employeeId, int leaveTypeId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(x => x.EmployeeID == employeeId && x.LeaveTypeID == leaveTypeId);
        }
    }
}
