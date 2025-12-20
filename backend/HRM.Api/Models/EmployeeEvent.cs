using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HRM.Api.Models
{
    [Table("EmployeeEvents")]
    public class EmployeeEvent
    {
        [Key]
        public long EventID { get; set; }

        public int AggregateID { get; set; } // EmployeeID

        [Required]
        public string EventType { get; set; } = string.Empty;

        // Lưu ý: Cột này trong DB là JSON, nhưng trong C# ta lưu chuỗi string JSON
        [Required] 
        public string EventData { get; set; } = string.Empty;

        // SequenceNumber: Số thứ tự event của aggregate này (tăng dần theo thời gian)
        public int SequenceNumber { get; set; }

        // EventVersion: Schema version để xử lý migration/versioning của event structure
        // VD: EventVersion = 1 (cấu trúc cũ), EventVersion = 2 (cấu trúc mới)
        public int EventVersion { get; set; } = 1;

        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}