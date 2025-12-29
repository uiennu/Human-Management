using HRM.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Services
{
    /// <summary>
    /// Implementation of authorization logic for sensitive request management
    /// 
    /// Role Hierarchy (from highest to lowest):
    /// Level 4: Admin - Can approve all requests (except their own)
    /// Level 3: HR Manager - Can approve requests from Level 1-2 and HR Employee
    /// Level 2: HR Employee - Can approve requests from Level 1 only
    /// Level 1: All other employees (IT, Sales, Finance, BOD Assistant, etc.)
    /// 
    /// Special Rules:
    /// 1. No one can approve their own request (conflict of interest)
    /// 2. HR Employee cannot approve requests from Manager roles or above
    /// 3. HR Manager cannot approve requests from Admin
    /// 4. Admin requests require another Admin or are auto-approved (configurable)
    /// </summary>
    public class SensitiveRequestAuthorizationService : ISensitiveRequestAuthorizationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SensitiveRequestAuthorizationService> _logger;

        // Role levels - higher number = higher authority
        private static readonly Dictionary<string, int> RoleLevels = new()
        {
            // Level 4 - Highest authority
            { "Admin", 4 },
            
            // Level 3 - HR Management
            { "HR Manager", 3 },
            
            // Level 2 - HR Staff (can view all, limited approval)
            { "HR Employee", 2 },
            
            // Level 1 - Standard employees and department managers
            { "IT Manager", 1 },
            { "Sales Manager", 1 },
            { "Finance Manager", 1 },
            { "BOD Assistant", 1 },
            { "IT Employee", 1 },
            { "Sales Employee", 1 },
            { "Finance Employee", 1 },
        };

        public SensitiveRequestAuthorizationService(
            AppDbContext context,
            ILogger<SensitiveRequestAuthorizationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<string>> GetUserRolesAsync(int employeeId)
        {
            var roles = await _context.EmployeeRoles
                .Where(er => er.EmployeeID == employeeId)
                .Join(_context.Roles, er => er.RoleID, r => r.RoleID, (er, r) => r.RoleName)
                .ToListAsync();

            return roles;
        }

        public int GetRoleLevel(IEnumerable<string> roles)
        {
            if (roles == null || !roles.Any())
                return 0;

            // Return the highest role level the user has
            return roles
                .Where(r => RoleLevels.ContainsKey(r))
                .Select(r => RoleLevels[r])
                .DefaultIfEmpty(0)
                .Max();
        }

        public async Task<bool> CanViewRequestAsync(int currentUserId, int requestEmployeeId)
        {
            var currentUserRoles = await GetUserRolesAsync(currentUserId);
            var currentUserLevel = GetRoleLevel(currentUserRoles);

            // HR Employee and above (Level 2+) can view all requests
            // This is already enforced by the HROnly policy on the controller
            return currentUserLevel >= 2;
        }

        public async Task<ApprovalPermissionDto> GetApprovalPermissionAsync(int currentUserId, int requestEmployeeId)
        {
            var result = new ApprovalPermissionDto
            {
                CanApprove = false,
                IsSelfRequest = currentUserId == requestEmployeeId
            };

            // Rule 1: No one can approve their own request
            if (result.IsSelfRequest)
            {
                result.Reason = "You cannot approve your own request (conflict of interest)";
                result.RequiresHigherAuthority = true;
                result.SuggestedApprover = await GetSuggestedApproverAsync(currentUserId);
                return result;
            }

            // Get roles for both users
            var currentUserRoles = await GetUserRolesAsync(currentUserId);
            var requestEmployeeRoles = await GetUserRolesAsync(requestEmployeeId);

            var currentUserLevel = GetRoleLevel(currentUserRoles);
            var requestEmployeeLevel = GetRoleLevel(requestEmployeeRoles);

            _logger.LogInformation(
                "Authorization check: CurrentUser {CurrentUserId} (Level {CurrentLevel}) trying to approve request from Employee {RequestEmployeeId} (Level {RequestLevel})",
                currentUserId, currentUserLevel, requestEmployeeId, requestEmployeeLevel);

            // Check by approver's role level
            switch (currentUserLevel)
            {
                case 4: // Admin
                    // Admin can approve all requests (except their own - already checked)
                    result.CanApprove = true;
                    result.Reason = "Admin has full approval authority";
                    break;

                case 3: // HR Manager
                    // HR Manager can approve requests from Level 1, 2 (but not Admin - Level 4)
                    if (requestEmployeeLevel <= 3)
                    {
                        // HR Manager can approve HR Employee and below
                        // But NOT another HR Manager (need Admin for that)
                        if (requestEmployeeLevel == 3)
                        {
                            result.CanApprove = false;
                            result.Reason = "HR Manager requests must be approved by Admin";
                            result.RequiresHigherAuthority = true;
                            result.SuggestedApprover = "Admin";
                        }
                        else
                        {
                            result.CanApprove = true;
                            result.Reason = "HR Manager can approve this request";
                        }
                    }
                    else
                    {
                        result.CanApprove = false;
                        result.Reason = "HR Manager cannot approve Admin requests";
                        result.RequiresHigherAuthority = true;
                        result.SuggestedApprover = "Another Admin";
                    }
                    break;

                case 2: // HR Employee
                    // HR Employee can only approve requests from Level 1 employees
                    if (requestEmployeeLevel == 1)
                    {
                        result.CanApprove = true;
                        result.Reason = "HR Employee can approve standard employee requests";
                    }
                    else
                    {
                        result.CanApprove = false;
                        result.Reason = requestEmployeeLevel >= 3 
                            ? "Manager and above requests must be approved by HR Manager or Admin"
                            : "HR Employee requests must be approved by HR Manager or Admin";
                        result.RequiresHigherAuthority = true;
                        result.SuggestedApprover = "HR Manager or Admin";
                    }
                    break;

                default:
                    // Level 1 or below - should not have approval rights
                    // (This shouldn't happen due to HROnly policy, but just in case)
                    result.CanApprove = false;
                    result.Reason = "Insufficient permissions to approve requests";
                    break;
            }

            return result;
        }

        /// <summary>
        /// Get a suggested approver when the current user cannot approve
        /// </summary>
        private async Task<string> GetSuggestedApproverAsync(int excludeEmployeeId)
        {
            // Find an Admin who is not the requesting employee
            var admin = await _context.EmployeeRoles
                .Include(er => er.Role)
                .Include(er => er.Employee)
                .Where(er => er.Role != null && er.Role.RoleName == "Admin" && er.EmployeeID != excludeEmployeeId)
                .Select(er => er.Employee != null ? er.Employee.FirstName + " " + er.Employee.LastName : "Unknown")
                .FirstOrDefaultAsync();

            if (admin != null)
                return $"Admin ({admin})";

            // If no other Admin, suggest HR Manager
            var hrManager = await _context.EmployeeRoles
                .Include(er => er.Role)
                .Include(er => er.Employee)
                .Where(er => er.Role != null && er.Role.RoleName == "HR Manager" && er.EmployeeID != excludeEmployeeId)
                .Select(er => er.Employee != null ? er.Employee.FirstName + " " + er.Employee.LastName : "Unknown")
                .FirstOrDefaultAsync();

            if (hrManager != null)
                return $"HR Manager ({hrManager})";

            return "Contact system administrator";
        }
    }
}
