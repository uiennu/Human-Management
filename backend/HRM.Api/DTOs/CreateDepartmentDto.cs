using System.ComponentModel.DataAnnotations;

namespace HRM.Api.DTOs
{
    // DTO cho thêm mới phòng ban
    public class CreateDepartmentDto
    {
        public string Name { get; set; } = string.Empty;
        
        // Có thể thêm Validate [Required] nếu muốn kỹ hơn
        public string DepartmentCode { get; set; } = string.Empty; 
        
        public string? Description { get; set; }
        
        public int? ManagerId { get; set; }
    }
}