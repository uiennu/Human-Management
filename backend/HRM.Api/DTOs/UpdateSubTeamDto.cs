using System.ComponentModel.DataAnnotations;

namespace HRM.Api.DTOs
{
    public class UpdateSubTeamDto
    {
        [Required]
        [StringLength(100)]
        public string TeamName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public int? TeamLeadId { get; set; }
    }
}
