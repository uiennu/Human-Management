using HRM.Api.DTOs.Organization;

namespace HRM.Api.Services
{
    public interface IOrganizationService
    {
        Task<OrganizationStructureDto> GetStructureAsync();
    }
}