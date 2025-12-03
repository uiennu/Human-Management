using HRM.Api.Constants;

namespace HRM.Api.Models
{
    public class LeaveRequest
    {
        public int LeaveRequestID { get; set; }
        public int EmployeeID { get; set; }
        public int ManagerID { get; set; }
        public int LeaveTypeID { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsHalfDayStart { get; set; }
        public bool IsHalfDayEnd { get; set; }
        public decimal TotalDays { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = LeaveStatus.Pending;
        public DateTime RequestedDate { get; set; } = DateTime.Now;
        public string? AttachmentPath { get; set; }

        // Navigation
        public virtual Employee? Employee { get; set; }
        public virtual Employee? Manager { get; set; }
        public virtual LeaveType? LeaveType { get; set; }
        public virtual ICollection<LeaveRequestHistory> Histories { get; set; }
    }
}
