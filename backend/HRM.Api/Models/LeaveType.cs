namespace HRM.Api.Models
{
    public class LeaveType
    {
        public int LeaveTypeID { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal DefaultQuota { get; set; }
        public string? Applicability { get; set; }

        // Navigation
        public virtual ICollection<EmployeeLeaveBalance> EmployeeLeaveBalances { get; set; }
        public virtual ICollection<LeaveRequest> LeaveRequests { get; set; }
    }
}
