// Services/IReportService.cs
using HRM.Api.DTOs.Reports;
public interface IReportService
{
    Task<EmployeeReportResponseDto> GenerateEmployeeProfileReportAsync(EmployeeReportRequestDto request, int currentUserId);
    Task<byte[]> ExportReportAsync(EmployeeReportRequestDto request, int currentUserId, string format); // Excel/PDF
    Task<List<string>> GetDepartmentListAsync();
    
}

// Services/ReportService.cs
public class ReportService : IReportService
{
    private readonly IReportRepository _repository;

    public ReportService(IReportRepository repository)
    {
        _repository = repository;
    }

    public async Task<EmployeeReportResponseDto> GenerateEmployeeProfileReportAsync(EmployeeReportRequestDto request, int currentUserId)
    {
        // 1. Get List Data (Paginated)
        var (items, totalCount) = await _repository.GetEmployeeReportDataAsync(request, currentUserId);

        // 2. Get Summary Data (For Donut Chart)
        var summary = await _repository.GetReportSummaryAsync(request, currentUserId);

        // 3. Construct Response
        return new EmployeeReportResponseDto
        {
            Summary = summary,
            Data = new PagedResult<EmployeeReportItemDto>
            {
                Items = items,
                TotalItems = totalCount,
                CurrentPage = request.Page,
                TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
            }
        };
    }

    public async Task<byte[]> ExportReportAsync(EmployeeReportRequestDto request, int currentUserId, string format)
    {
        // Logic sử dụng thư viện như EPPlus (Excel) hoặc iTextSharp (PDF)
        // Để export toàn bộ data, set PageSize = Max
        request.PageSize = int.MaxValue; 
        request.Page = 1;
        
        var (items, _) = await _repository.GetEmployeeReportDataAsync(request, currentUserId);
        
        if (format.ToLower() == "excel")
        {
            // return GenerateExcel(items);
            return new byte[0]; // Placeholder
        }
        // PDF logic...
        return new byte[0];
    }

    public async Task<List<string>> GetDepartmentListAsync()
    {
        return await _repository.GetDepartmentNamesAsync();
    }
}