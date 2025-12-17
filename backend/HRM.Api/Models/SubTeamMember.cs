using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace HRM.Api.Models
{
    public class SubTeamMember
    {
        public int ID { get; set; }
        public int SubTeamID { get; set; }
        public int EmployeeID { get; set; }

        // Navigation Properties
        [ForeignKey("SubTeamID")]
        public virtual SubTeam SubTeam { get; set; }

        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; }
    }
}
