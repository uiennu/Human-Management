using HRM.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/organization")]
    public class OrganizationController : ControllerBase
    {
        private readonly IOrganizationService _service;

        public OrganizationController(IOrganizationService service)
        {
            _service = service;
        }

        [HttpGet("getstructure")]
        public async Task<IActionResult> GetStructure()
        {
            try
            {
                var result = await _service.GetStructureAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}