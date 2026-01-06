// Controllers/ReportsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using HRM.Api.DTOs.Reports;
using HRM.Api.Services; // Giả sử đây là nơi chứa IReportService

[ApiController]
[Route("api/[controller]")]
[Authorize] // Yêu cầu đăng nhập
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost("employees")]
    public async Task<IActionResult> GetEmployeeReport([FromBody] EmployeeReportRequestDto request)
    {
        try
        {
            // Lấy ID người dùng đang đăng nhập từ Token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("Invalid User ID");
            }

            var result = await _reportService.GenerateEmployeeProfileReportAsync(request, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            // Log error here
            return StatusCode(500, new { message = "Internal Server Error", details = ex.Message });
        }
    }

    [HttpPost("employees/export")]
    public async Task<IActionResult> ExportReport([FromBody] EmployeeReportRequestDto request, [FromQuery] string format = "excel")
    {
        try
        {
            // Lấy User ID từ token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("Invalid User ID");
            }

            // Gọi service để lấy nội dung file
            var fileContent = await _reportService.ExportReportAsync(request, userId, format);
            
            // Xác định ContentType và FileName
            string contentType;
            string fileName;

            if (format.ToLower() == "excel" || format.ToLower() == "csv")
            {
                contentType = "text/csv"; // <--- Đổi thành text/csv
                fileName = $"EmployeeReport_{DateTime.Now:yyyyMMdd_HHmm}.csv"; // <--- Đuôi .csv
            }
            else // PDF
            {
                contentType = "application/pdf";
                fileName = $"EmployeeReport_{DateTime.Now:yyyyMMdd_HHmm}.pdf";
            }

            // Trả về file trực tiếp
            return File(fileContent, contentType, fileName);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error exporting report", details = ex.Message });
        }
    }

    [HttpGet("departments")] // API URL sẽ là: GET /api/reports/departments
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _reportService.GetDepartmentListAsync();
        return Ok(departments);
    }

    [HttpGet("subteams")]
    public async Task<IActionResult> GetSubTeams([FromQuery] string? department) // <--- NHỚ DẤU ?
    {
        // 1. Lấy ID người dùng (Logic tìm ID bất tử)
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("id")?.Value 
                    ?? User.FindFirst("sub")?.Value
                    ?? User.FindFirst("EmployeeID")?.Value;

        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized("User ID not found in token");
        }

        // 2. Gọi Service (Nếu department null, Service sẽ tự tìm phòng của userId)
        var teams = await _reportService.GetSubTeamListAsync(department, userId);
        
        return Ok(teams);
    }
}