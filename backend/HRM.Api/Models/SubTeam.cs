namespace HRM.Api.Models
{
    public class SubTeam
    {
        public int SubTeamID { get; set; }
        public string TeamName { get; set; } = "";
        public string? Description { get; set; }
        public int DepartmentID { get; set; }
        public int? TeamLeadID { get; set; }

        // Navigation properties
        public virtual Department? Department { get; set; }
        public virtual Employee? TeamLead { get; set; }
        public virtual ICollection<SubTeamMember> SubTeamMembers { get; set; } = new List<SubTeamMember>();
    }
}
