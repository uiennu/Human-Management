using Microsoft.AspNetCore.Http;

namespace HRM.Api.DTOs
{
    public class CreateLeaveRequestDto
    {
        public int LeaveTypeID { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsHalfDayStart { get; set; }
        public bool IsHalfDayEnd { get; set; }
        public decimal TotalDays { get; set; }
        public string? Reason { get; set; }
        public List<IFormFile>? Attachments { get; set; }
    }

    public class LeaveRequestListItemDto
    {
        public int LeaveRequestID { get; set; }
        public int LeaveTypeID { get; set; }
        public string LeaveTypeName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalDays { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedDate { get; set; }
    }

    public class LeaveRequestDetailDto
    {
        public int LeaveRequestID { get; set; }
        public int EmployeeID { get; set; }
        public LeaveTypeDto LeaveType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsHalfDayStart { get; set; }
        public bool IsHalfDayEnd { get; set; }
        public decimal TotalDays { get; set; }
        public string? Reason { get; set; }
        public List<string>? Attachments { get; set; }
        public string Status { get; set; }
        public DateTime RequestedDate { get; set; }
        public ApprovalInfoDto? ApprovalInfo { get; set; }
    }

    public class LeaveTypeDto
    {
        public int LeaveTypeID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal DefaultQuota { get; set; }
    }

    public class ApprovalInfoDto
    {
        public string ApproverName { get; set; } = string.Empty;
        public DateTime ActionDate { get; set; }
        public string? Note { get; set; }
    }

    public class LeaveRequestResponseDto
    {
        public int LeaveRequestID { get; set; }
        public string? Status { get; set; }
        public string? Message { get; set; }
    }

    public class PagedResultDto<T>
    {
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public List<T> Data { get; set; }
    }
}
