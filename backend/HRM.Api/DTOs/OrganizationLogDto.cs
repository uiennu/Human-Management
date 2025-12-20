using System;
namespace HRM.Api.DTOs
{
    public class OrganizationLogDto
    {
        public string EventType { get; set; }
        public string TargetEntity { get; set; }
        public int TargetID { get; set; }
        public string EventData { get; set; }
        public int PerformedBy { get; set; }
        public DateTime PerformedAt { get; set; } = DateTime.Now;
    }
}