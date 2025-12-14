namespace HRM.Api.Models
{
    public class SubTeamMember
    {
        public int ID { get; set; }
        public int SubTeamID { get; set; }
        public int EmployeeID { get; set; }

        // Navigation properties
        public virtual SubTeam? SubTeam { get; set; }
        public virtual Employee? Employee { get; set; }
    }
}
