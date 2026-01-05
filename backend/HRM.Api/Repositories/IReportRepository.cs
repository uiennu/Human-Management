using HRM.Api.DTOs.Reports;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRM.Api.Repositories
{
    public interface IReportRepository
    {
        Task<(List<EmployeeReportItemDto> Items, int TotalCount)> GetEmployeeReportDataAsync(EmployeeReportRequestDto filter, int currentManagerId);
        Task<ReportSummaryDto> GetReportSummaryAsync(EmployeeReportRequestDto filter, int currentManagerId);
        Task<List<string>> GetDepartmentNamesAsync();
        Task<List<string>> GetSubTeamNamesAsync(string departmentName, int managerId);
    }
}