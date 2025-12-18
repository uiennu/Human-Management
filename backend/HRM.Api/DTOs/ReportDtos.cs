// DTOs/ReportDtos.cs
using System;
using System.Collections.Generic;

namespace HRM.Api.DTOs.Reports
{
    // Request: Các bộ lọc từ UI
    public class EmployeeReportRequestDto
    {
        public string Department { get; set; } = "All under me"; // "All under me", "Engineering", ...
        public string SearchTerm { get; set; } // Name or ID
        public DateTime? HireDateFrom { get; set; }
        public DateTime? HireDateTo { get; set; }
        public List<string> SelectedStatuses { get; set; } // ["Active", "On Leave", "Terminated"]
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // Response: Dữ liệu trả về cho UI
    public class EmployeeReportResponseDto
    {
        public ReportSummaryDto Summary { get; set; }
        public PagedResult<EmployeeReportItemDto> Data { get; set; }
    }

    // Phần thống kê cho biểu đồ tròn (Donut Chart)
    public class ReportSummaryDto
    {
        public int TotalEmployees { get; set; }
        public int ActiveCount { get; set; }
        public int OnLeaveCount { get; set; }
        public int TerminatedCount { get; set; }
        
        // Frontend tự tính phần trăm, nhưng backend trả về số liệu thô là đủ
    }

    // Dữ liệu chi tiết từng dòng trong bảng
    public class EmployeeReportItemDto
    {
        public string EmployeeId { get; set; } // e.g., "EMP001" (Format từ ID int)
        public string FullName { get; set; }
        public string Position { get; set; } // Lấy từ Roles hoặc JobTitle
        public string Department { get; set; }
        public DateTime HireDate { get; set; }
        public string Status { get; set; } // "Active", "On Leave", "Terminated"
        public string AvatarUrl { get; set; }
    }

    // Helper class cho phân trang
    public class PagedResult<T>
    {
        public List<T> Items { get; set; }
        public int TotalItems { get; set; }
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
    }
}