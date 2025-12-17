using HRM.Api.DTOs.Organization;

namespace HRM.Api.Repositories
{
    public interface IOrganizationRepository
    {
        Task<OrganizationStructureDto> GetStructureAsync();
    }
}