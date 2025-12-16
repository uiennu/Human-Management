using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public interface IEmployeeProfileRepository : IRepository<Employee>
    {
        Task<Employee?> FindByEmployeeIdAsync(int employeeId);
        Task<Employee?> GetEmployeeWithDetailsAsync(int employeeId);
    }

    public class EmployeeProfileRepository : Repository<Employee>, IEmployeeProfileRepository
    {
        public EmployeeProfileRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Employee?> FindByEmployeeIdAsync(int employeeId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(e => e.EmployeeID == employeeId);
        }

        public async Task<Employee?> GetEmployeeWithDetailsAsync(int employeeId)
        {
            return await _dbSet
                .Include(e => e.Department)
                .Include(e => e.Manager)
                .Include(e => e.LeaveBalances)
                    .ThenInclude(lb => lb.LeaveType)
                .Include(e => e.EmergencyContacts)
                .FirstOrDefaultAsync(e => e.EmployeeID == employeeId);
        }
    }
}
