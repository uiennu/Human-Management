using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Repositories
{
    public interface ISensitiveRequestRepository
    {
        /// <summary>
        /// Get base query for sensitive requests (excludes OTP records)
        /// </summary>
        IQueryable<EmployeeProfileChange> GetSensitiveRequestsQuery();

        /// <summary>
        /// Get a sensitive request by ID with related data
        /// </summary>
        Task<EmployeeProfileChange?> GetByIdWithDetailsAsync(int changeId);

        /// <summary>
        /// Get related changes for a request group (same employee, same minute)
        /// </summary>
        Task<List<EmployeeProfileChange>> GetRelatedChangesAsync(int employeeId, DateTime requestTime);

        /// <summary>
        /// Get user roles by employee ID
        /// </summary>
        Task<List<string>> GetUserRolesAsync(int employeeId);

        /// <summary>
        /// Find an approver by role (excluding specific employee)
        /// </summary>
        Task<string?> FindApproverByRoleAsync(string roleName, int excludeEmployeeId);

        /// <summary>
        /// Get next sequence number for employee events
        /// </summary>
        Task<int> GetNextEventSequenceNumberAsync(int employeeId);

        /// <summary>
        /// Add an employee event
        /// </summary>
        Task AddEmployeeEventAsync(EmployeeEvent employeeEvent);

        /// <summary>
        /// Add a document to a profile change request
        /// </summary>
        Task AddDocumentAsync(EmployeeProfileChangeDocument document);

        /// <summary>
        /// Get documents for a specific change request
        /// </summary>
        Task<List<EmployeeProfileChangeDocument>> GetDocumentsByChangeIdAsync(int changeId);

        /// <summary>
        /// Save all changes to database
        /// </summary>
        Task SaveChangesAsync();
    }

    public class SensitiveRequestRepository : ISensitiveRequestRepository
    {
        private readonly AppDbContext _context;

        public SensitiveRequestRepository(AppDbContext context)
        {
            _context = context;
        }

        public IQueryable<EmployeeProfileChange> GetSensitiveRequestsQuery()
        {
            return _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.Approver)
                .Include(c => c.Documents)
                .Where(c => !c.FieldName.StartsWith("OTP_"))
                .Where(c => c.Status != "PendingOTP" && c.Status != "OTPGenerated");
        }

        public async Task<EmployeeProfileChange?> GetByIdWithDetailsAsync(int changeId)
        {
            return await _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.Approver)
                .Include(c => c.Documents)
                .FirstOrDefaultAsync(c => c.ChangeID == changeId);
        }

        public async Task<List<EmployeeProfileChange>> GetRelatedChangesAsync(int employeeId, DateTime requestTime)
        {
            // Truncate to minute precision
            var startTime = new DateTime(requestTime.Year, requestTime.Month, requestTime.Day, 
                                         requestTime.Hour, requestTime.Minute, 0);
            var endTime = startTime.AddMinutes(1);

            return await _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.Approver)
                .Include(c => c.Documents)
                .Where(c => c.EmployeeID == employeeId)
                .Where(c => !c.FieldName.StartsWith("OTP_"))
                .Where(c => c.RequestedDate >= startTime && c.RequestedDate < endTime)
                .ToListAsync();
        }

        public async Task<List<string>> GetUserRolesAsync(int employeeId)
        {
            return await _context.EmployeeRoles
                .Where(er => er.EmployeeID == employeeId)
                .Join(_context.Roles, er => er.RoleID, r => r.RoleID, (er, r) => r.RoleName)
                .ToListAsync();
        }

        public async Task<string?> FindApproverByRoleAsync(string roleName, int excludeEmployeeId)
        {
            return await _context.EmployeeRoles
                .Include(er => er.Role)
                .Include(er => er.Employee)
                .Where(er => er.Role != null && er.Role.RoleName == roleName && er.EmployeeID != excludeEmployeeId)
                .Select(er => er.Employee != null ? er.Employee.FirstName + " " + er.Employee.LastName : null)
                .FirstOrDefaultAsync();
        }

        public async Task<int> GetNextEventSequenceNumberAsync(int employeeId)
        {
            var lastEvent = await _context.EmployeeEvents
                .Where(e => e.AggregateID == employeeId)
                .OrderByDescending(e => e.SequenceNumber)
                .FirstOrDefaultAsync();

            return (lastEvent?.SequenceNumber ?? 0) + 1;
        }

        public async Task AddEmployeeEventAsync(EmployeeEvent employeeEvent)
        {
            _context.EmployeeEvents.Add(employeeEvent);
            await Task.CompletedTask;
        }

        public async Task AddDocumentAsync(EmployeeProfileChangeDocument document)
        {
            _context.EmployeeProfileChangeDocuments.Add(document);
            await Task.CompletedTask;
        }

        public async Task<List<EmployeeProfileChangeDocument>> GetDocumentsByChangeIdAsync(int changeId)
        {
            return await _context.EmployeeProfileChangeDocuments
                .Where(d => d.ChangeID == changeId)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
