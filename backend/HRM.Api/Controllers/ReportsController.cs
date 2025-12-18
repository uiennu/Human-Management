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
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(userIdString, out int userId);

        var fileContent = await _reportService.ExportReportAsync(request, userId, format);
        
        string contentType = format == "excel" 
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
            : "application/pdf";
            
        string fileName = $"EmployeeReport_{DateTime.Now:yyyyMMdd}.{(format == "excel" ? "xlsx" : "pdf")}";

        return File(fileContent, contentType, fileName);
    }

    [HttpGet("departments")] // API URL sẽ là: GET /api/reports/departments
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _reportService.GetDepartmentListAsync();
        return Ok(departments);
    }
}