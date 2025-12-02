namespace HRM.Api.DTOs
{
    public class CreateWorkHandoverDto
    {
        public int LeaveRequestID { get; set; }
        public int AssigneeEmployeeID { get; set; }
        public string? HandoverNotes { get; set; }
    }

    public class WorkHandoverDto
    {
        public int HandoverID { get; set; }
        public int LeaveRequestID { get; set; }
        public EmployeeBasicDto AssigneeEmployee { get; set; }
        public EmployeeBasicDto Manager { get; set; }
        public string? HandoverNotes { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class EmployeeBasicDto
    {
        public int EmployeeID { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
    }
}
