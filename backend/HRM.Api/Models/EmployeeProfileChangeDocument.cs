namespace HRM.Api.Models
{
    public class EmployeeProfileChangeDocument
    {
        public int DocumentID { get; set; }
        public int ChangeID { get; set; }
        public string DocumentPath { get; set; } = "";
        public string DocumentName { get; set; } = "";
        public DateTime UploadedDate { get; set; } = DateTime.Now;

        // Navigation property
        public virtual EmployeeProfileChange? Change { get; set; }
    }
}
