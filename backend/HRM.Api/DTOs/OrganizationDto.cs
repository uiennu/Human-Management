using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace HRM.Api.DTOs
{
    public class RoleDto
    {
        public int RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
    }

    public class DepartmentDto
    {
        public int DepartmentID { get; set; }
        [Required(ErrorMessage = "Department name is required.")]
        public string DepartmentName { get; set; } = string.Empty;
        public string? DepartmentCode { get; set; }
        public string? Description { get; set; }
        public int? ManagerId { get; set; }
        public string? ManagerName { get; set; }
    }

    public class ManagerDto
    {
        public int EmployeeID { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int? DepartmentID { get; set; }
    }

    public class OrganizationStructureDto
    {
        public CompanyInfoDto Company { get; set; } = new();
        public List<DepartmentHierarchyDto> Departments { get; set; } = new();
        public List<EmployeeSimpleDto> UnassignedEmployees { get; set; } = new();
    }

    public class CompanyInfoDto
    {
        public string Name { get; set; } = string.Empty;
        public string Ceo { get; set; } = string.Empty;
    }

    public class DepartmentHierarchyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Manager { get; set; } = "N/A";
        public string? ManagerId { get; set; }
        public List<TeamDto> Teams { get; set; } = new();
    }

    public class MoveEmployeeDto
    {
        public int EmployeeId { get; set; }
        public int TargetTeamId { get; set; }
    }

}
