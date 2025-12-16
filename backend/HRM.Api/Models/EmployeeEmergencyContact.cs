using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRM.Api.Models
{
    [Table("EmployeeEmergencyContacts")]
    public class EmployeeEmergencyContact
    {
        [Key]
        public int ID { get; set; }
        
        public int EmployeeID { get; set; }
        
        public string Name { get; set; } = "";
        
        public string? Relation { get; set; }
        
        public string? Phone { get; set; }

        // Navigation property để liên kết ngược lại với Employee
        [ForeignKey("EmployeeID")]
        public virtual Employee? Employee { get; set; }
    }
}