namespace HRM.Api.Models
{
    public class EmployeeLeaveBalance
    {
        public int EmployeeLeaveBalanceID { get; set; }
        public int EmployeeID { get; set; }
        public int LeaveTypeID { get; set; }
        public decimal BalanceDays { get; set; }
        public DateTime LastUpdatedDate { get; set; } = DateTime.Now;

        // Navigation
        public virtual Employee? Employee { get; set; }
        public virtual LeaveType? LeaveType { get; set; }
    }
}
