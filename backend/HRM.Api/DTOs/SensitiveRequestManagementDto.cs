namespace HRM.Api.DTOs
{
    /// <summary>
    /// DTO for listing sensitive update requests (for HR management)
    /// </summary>
    public class SensitiveRequestListItemDto
    {
        public int RequestId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = "";
        public string EmployeeCode { get; set; } = "";
        public string Department { get; set; } = "";
        public string FieldName { get; set; } = "";
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string Status { get; set; } = "";
        public DateTime RequestedDate { get; set; }
        public string? ApproverName { get; set; }
        public DateTime? ApprovalDate { get; set; }
    }

    /// <summary>
    /// DTO for grouped sensitive requests by employee
    /// </summary>
    public class GroupedSensitiveRequestDto
    {
        public int RequestGroupId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = "";
        public string EmployeeCode { get; set; } = "";
        public string Department { get; set; } = "";
        public string Status { get; set; } = "";
        public DateTime RequestedDate { get; set; }
        public string? ApproverName { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public List<SensitiveFieldChangeDto> Changes { get; set; } = new();
        
        // Authorization info (populated based on current user)
        public RequestPermissionDto? Permission { get; set; }
    }

    /// <summary>
    /// DTO for permission info on a request
    /// </summary>
    public class RequestPermissionDto
    {
        public bool CanApprove { get; set; }
        public bool CanReject { get; set; }
        public string? Reason { get; set; }
        public bool IsSelfRequest { get; set; }
        public bool RequiresHigherAuthority { get; set; }
        public string? SuggestedApprover { get; set; }
    }

    /// <summary>
    /// DTO for individual field change in a request
    /// </summary>
    public class SensitiveFieldChangeDto
    {
        public int ChangeId { get; set; }
        public string FieldName { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
    }

    /// <summary>
    /// DTO for paginated response of sensitive requests
    /// </summary>
    public class SensitiveRequestListResponseDto
    {
        public List<GroupedSensitiveRequestDto> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public SensitiveRequestStatsDto Stats { get; set; } = new();
        
        // Current user's authorization info
        public UserAuthorizationInfoDto? CurrentUserAuth { get; set; }
    }

    /// <summary>
    /// DTO for current user's authorization info
    /// </summary>
    public class UserAuthorizationInfoDto
    {
        public int UserId { get; set; }
        public List<string> Roles { get; set; } = new();
        public int RoleLevel { get; set; }
        public string RoleLevelName { get; set; } = "";
        public bool CanApproveAny { get; set; }
    }

    /// <summary>
    /// DTO for statistics of sensitive requests
    /// </summary>
    public class SensitiveRequestStatsDto
    {
        public int All { get; set; }
        public int Pending { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
    }

    /// <summary>
    /// DTO for HR to approve/reject a sensitive request
    /// </summary>
    public class ProcessSensitiveRequestDto
    {
        public int RequestGroupId { get; set; }
        public string Action { get; set; } = ""; // "Approve" or "Reject"
        public string? Reason { get; set; }
    }

    /// <summary>
    /// DTO for the response after processing a sensitive request
    /// </summary>
    public class ProcessSensitiveRequestResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
    }
}
