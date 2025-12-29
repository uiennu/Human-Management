using HRM.Api.DTOs;

namespace HRM.Api.Services
{
    public interface ISensitiveRequestService
    {
        /// <summary>
        /// Get all sensitive requests with permission info for current user
        /// </summary>
        Task<SensitiveRequestListResponseDto> GetAllSensitiveRequestsAsync(
            int currentUserId,
            string? status = null,
            int page = 1,
            int pageSize = 10,
            string? searchTerm = null);
        
        /// <summary>
        /// Get a specific request by ID with permission info
        /// </summary>
        Task<GroupedSensitiveRequestDto?> GetSensitiveRequestByIdAsync(int requestGroupId, int currentUserId);
        
        /// <summary>
        /// Process (approve/reject) a request with authorization check
        /// </summary>
        Task<ProcessSensitiveRequestResponseDto> ProcessRequestAsync(
            int requestGroupId,
            string action,
            int approverId,
            string? reason = null);
    }
}
