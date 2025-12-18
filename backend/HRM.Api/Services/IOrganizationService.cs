using HRM.Api.DTOs.Organization;

namespace HRM.Api.Services
{
    public interface IOrganizationService
    {
        Task<OrganizationStructureDto> GetStructureAsync();

        Task<(bool Success, string Message, object? Data)> AddDepartmentAsync(CreateDepartmentDto dto);
        Task<(bool Success, string Message)> DeleteDepartmentAsync(int id);
        Task<(bool Success, string Message, int? TeamId)> DeleteTeamAsync(int id);
    }
}