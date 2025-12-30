namespace HRM.Api.Models
{
    public class EmployeeProfileChange
    {
        public int ChangeID { get; set; }
        public int EmployeeID { get; set; }
        public string FieldName { get; set; } = "";
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public DateTime RequestedDate { get; set; } = DateTime.Now;
        public int? ApproverID { get; set; }
        public DateTime? ApprovalDate { get; set; }

        // Navigation properties
        public virtual Employee? Employee { get; set; }
        public virtual Employee? Approver { get; set; }
        public virtual ICollection<EmployeeProfileChangeDocument> Documents { get; set; } = new List<EmployeeProfileChangeDocument>();
    }
}
