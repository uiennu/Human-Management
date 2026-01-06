using HRM.Api.DTOs.Reports;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRM.Api.Services 
{
    public interface IReportService
    {
        Task<EmployeeReportResponseDto> GenerateEmployeeProfileReportAsync(EmployeeReportRequestDto request, int currentUserId);
        Task<byte[]> ExportReportAsync(EmployeeReportRequestDto request, int currentUserId, string format);
        Task<List<string>> GetDepartmentListAsync();
        Task<List<string>> GetSubTeamListAsync(string departmentName, int userId);
    }
}