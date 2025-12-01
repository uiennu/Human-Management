namespace HRM.Api.Models
{
    public class WorkHandover
    {
        public int HandoverID { get; set; }
        public int LeaveRequestID { get; set; }
        public int AssigneeEmployeeID { get; set; }
        public int ManagerID { get; set; }
        public string? HandoverNotes { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation
        public virtual LeaveRequest? LeaveRequest { get; set; }
        public virtual Employee? AssigneeEmployee { get; set; }
        public virtual Employee? Manager { get; set; }
    }
}
