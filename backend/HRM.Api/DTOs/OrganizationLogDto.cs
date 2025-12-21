using System;

namespace HRM.Api.DTOs
{
    public class OrganizationLogDto
    {
        public int LogID { get; set; }
        public string EventType { get; set; }
        public string TargetEntity { get; set; }
        public int TargetID { get; set; }
        public string EventData { get; set; } // JSON string
        public int PerformedBy { get; set; }
        public string PerformedByName { get; set; } // Employee name who performed the action
        public DateTime PerformedAt { get; set; }
    }
}