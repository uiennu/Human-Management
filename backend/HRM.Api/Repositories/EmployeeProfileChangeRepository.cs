using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public interface IEmployeeProfileChangeRepository : IRepository<EmployeeProfileChange>
    {
        Task<List<EmployeeProfileChange>> GetPendingChangesByEmployeeIdAsync(int employeeId);
        Task<List<EmployeeProfileChange>> GetAllChangesByEmployeeIdAsync(int employeeId);
        Task<EmployeeProfileChange?> GetChangeByIdAsync(int changeId);
        Task<int> DeleteAllOtpsByEmployeeIdAsync(int employeeId);
    }

    public class EmployeeProfileChangeRepository : Repository<EmployeeProfileChange>, IEmployeeProfileChangeRepository
    {
        public EmployeeProfileChangeRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<int> DeleteAllOtpsByEmployeeIdAsync(int employeeId)
        {
            // Xóa tất cả OTP của employee bằng SQL
            var sql = "DELETE FROM EmployeeProfileChanges WHERE EmployeeID = {0} AND FieldName LIKE 'OTP_%'";
            return await _context.Database.ExecuteSqlRawAsync(sql, employeeId);
        }
        public async Task<List<EmployeeProfileChange>> GetPendingChangesByEmployeeIdAsync(int employeeId)
        {
            return await _dbSet
                .Where(c => c.EmployeeID == employeeId && c.Status == "Pending")
                .OrderByDescending(c => c.RequestedDate)
                .ToListAsync();
        }

        public async Task<List<EmployeeProfileChange>> GetAllChangesByEmployeeIdAsync(int employeeId)
        {
            return await _dbSet
                .Where(c => c.EmployeeID == employeeId)
                .OrderByDescending(c => c.RequestedDate)
                .ToListAsync();
        }

        public async Task<EmployeeProfileChange?> GetChangeByIdAsync(int changeId)
        {
            return await _dbSet
                .Include(c => c.Employee)
                .FirstOrDefaultAsync(c => c.ChangeID == changeId);
        }
    }
}
