namespace HRM.Api.DTOs.Organization
{
    public class OrganizationStructureDto
    {
        public CompanyInfoDto Company { get; set; }
        public List<DepartmentHierarchyDto> Departments { get; set; }
        public List<EmployeeSimpleDto> UnassignedEmployees { get; set; }
    }

    public class CompanyInfoDto
    {
        public string Name { get; set; }
        public string Ceo { get; set; }
    }

    public class DepartmentHierarchyDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Manager { get; set; }
        public string ManagerId { get; set; }
        public string Description { get; set; }
        public List<TeamDto> Teams { get; set; }
    }

    public class TeamDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Lead { get; set; }
        public string LeadId { get; set; }
        public string Description { get; set; }
        public List<EmployeeSimpleDto> Employees { get; set; }
    }

    public class EmployeeSimpleDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Position { get; set; }
        public string Avatar { get; set; }
    }
}