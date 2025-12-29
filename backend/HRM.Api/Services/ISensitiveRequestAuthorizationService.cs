using HRM.Api.DTOs;

namespace HRM.Api.Services
{
    /// <summary>
    /// Service to handle authorization logic for sensitive request management
    /// </summary>
    public interface ISensitiveRequestAuthorizationService
    {
        /// <summary>
        /// Check if current user can view a sensitive request
        /// </summary>
        Task<bool> CanViewRequestAsync(int currentUserId, int requestEmployeeId);

        /// <summary>
        /// Check if current user can approve/reject a sensitive request
        /// Returns detailed permission info
        /// </summary>
        Task<ApprovalPermissionDto> GetApprovalPermissionAsync(int currentUserId, int requestEmployeeId);

        /// <summary>
        /// Get the role hierarchy level (higher = more authority)
        /// </summary>
        int GetRoleLevel(IEnumerable<string> roles);

        /// <summary>
        /// Get user's roles by employee ID
        /// </summary>
        Task<List<string>> GetUserRolesAsync(int employeeId);
    }

    /// <summary>
    /// DTO containing approval permission details
    /// </summary>
    public class ApprovalPermissionDto
    {
        public bool CanApprove { get; set; }
        public string? Reason { get; set; }
        public bool IsSelfRequest { get; set; }
        public bool RequiresHigherAuthority { get; set; }
        public string? SuggestedApprover { get; set; }
    }
}
