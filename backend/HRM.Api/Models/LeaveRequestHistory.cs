namespace HRM.Api.Models
{
    public class LeaveRequestHistory
    {
        public int HistoryID { get; set; }
        public int LeaveRequestID { get; set; }
        public string Status { get; set; }
        public string? Notes { get; set; }
        public int ChangedByEmployeeID { get; set; }
        public DateTime ChangeDate { get; set; } = DateTime.Now;

        // Navigation
        public virtual LeaveRequest? LeaveRequest { get; set; }
        public virtual Employee? ChangedByEmployee { get; set; }
    }
}
