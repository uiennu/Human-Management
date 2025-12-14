using System.ComponentModel.DataAnnotations;

namespace HRM.Api.DTOs
{
    /// <summary>
    /// DTO for registering a new employee (HR/Admin only)
    /// </summary>
    public class RegisterEmployeeDto
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string FirstName { get; set; } = "";

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string LastName { get; set; } = "";

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = "";

        [Required(ErrorMessage = "Phone number is required")]
        [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
        public string Phone { get; set; } = "";

        [StringLength(255, ErrorMessage = "Address cannot exceed 255 characters")]
        public string? Address { get; set; }

        [Required(ErrorMessage = "Hire date is required")]
        public DateTime HireDate { get; set; }

        public int? DepartmentID { get; set; }

        public int? ManagerID { get; set; }

        [Required(ErrorMessage = "Role is required")]
        public int RoleID { get; set; }

        // Optional fields
        [EmailAddress(ErrorMessage = "Invalid personal email format")]
        [StringLength(100, ErrorMessage = "Personal email cannot exceed 100 characters")]
        public string? PersonalEmail { get; set; }

        [StringLength(10, ErrorMessage = "Gender cannot exceed 10 characters")]
        public string? Gender { get; set; }
    }

    /// <summary>
    /// Response after successful employee registration
    /// </summary>
    public class RegisterEmployeeResponseDto
    {
        public int EmployeeId { get; set; }
        public string Email { get; set; } = "";
        public string TempPassword { get; set; } = "";
        public string Message { get; set; } = "";
    }

    public class EmployeeListDto
    {
        public int EmployeeID { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public string? Position { get; set; } // Role
        public DateTime HireDate { get; set; }
        public bool IsActive { get; set; }
    }
}
