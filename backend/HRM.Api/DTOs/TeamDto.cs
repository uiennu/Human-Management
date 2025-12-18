using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace HRM.Api.DTOs
{
    // Request DTO for adding employee to team
    public class AddEmployeeToTeamDto
    {
        [Required(ErrorMessage = "Employee ID is required")]
        public int EmployeeId { get; set; }
    }

    // Response DTO for add employee success (201 Created)
    public class AddEmployeeResponseDto
    {
        public int EmployeeId { get; set; }
    }

    // Response DTO for remove employee success (200 OK)
    public class RemoveEmployeeResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public RemoveEmployeeDataDto? Data { get; set; }
    }

    public class RemoveEmployeeDataDto
    {
        public int EmployeeId { get; set; }
        public int TeamId { get; set; }
    }

    // Response DTO for unassigned employees (200 OK)
    public class UnassignedEmployeesResponseDto
    {
        public List<int> UnassignedEmployees { get; set; } = new List<int>();
    }

    // DTOs for team listing
    public class TeamResponseDto
    {
        public int SubTeamID { get; set; }
        public string TeamName { get; set; } = "";
        public string? Description { get; set; }
        public int DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public int? TeamLeadID { get; set; }
        public string? TeamLeadName { get; set; }
        public int MemberCount { get; set; }
        public List<TeamMemberDto> Members { get; set; } = new List<TeamMemberDto>();
    }

    public class TeamDto
    {
        public int SubTeamID { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DepartmentID { get; set; }
        
        public int? TeamLeadID { get; set; }
        public string TeamLeadName { get; set; } = string.Empty;
        
        // Service sẽ tự ghép danh sách này vào
        public List<TeamMemberDto> Members { get; set; } = new List<TeamMemberDto>();
    }

    public class TeamMemberDto
    {
        public int SubTeamID { get; set; }
        public int EmployeeID { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public string? Phone { get; set; }
        public int? DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public string Position { get; set; }
        public string AvatarUrl { get; set; }
    }
}
