using HRM.Api.DTOs.Organization;
using HRM.Api.Repositories;

namespace HRM.Api.Services
{
    public class OrganizationService : IOrganizationService
    {
        private readonly IOrganizationRepository _repo;

        public OrganizationService(IOrganizationRepository repo)
        {
            _repo = repo;
        }

        public Task<OrganizationStructureDto> GetStructureAsync()
        {
            return _repo.GetStructureAsync();
        }
    }
}