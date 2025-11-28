namespace HRM.Api.Models
{
    public class Department
    {
        public int DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public string? DepartmentCode { get; set; }
        public string? Description { get; set; }

        public int? ManagerID { get; set; }
    }
}
