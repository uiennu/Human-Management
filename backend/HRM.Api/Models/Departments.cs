
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRM.Api.Models
{
    public class Department
    {
        [Key]
        public int DepartmentID { get; set; }
        public string DepartmentName { get; set; }
        public string DepartmentCode { get; set; }
        public string Description { get; set; }
        public int? ManagerID { get; set; }

        // Navigation Properties (Quan trọng để Include)
        [ForeignKey("ManagerID")]
        public virtual Employee Manager { get; set; }

        // Quan hệ 1-n: 1 Department có nhiều SubTeam
        public virtual ICollection<SubTeam> SubTeams { get; set; }
    }
}