namespace HRM.Api.DTOs
{
    public class UpdateDepartmentDto
    {
        public string DepartmentName { get; set; }
        public string DepartmentCode { get; set; }
        public string Description { get; set; }
        public int? ManagerID { get; set; } // Cho phép null nếu muốn gỡ quản lý
    }
}