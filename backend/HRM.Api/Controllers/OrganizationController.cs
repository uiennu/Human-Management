using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrganizationController : ControllerBase
    {
        private readonly IOrganizationService _service;

        public OrganizationController(IOrganizationService service)
        {
            _service = service;
        }

        // Endpoint: GET /api/organization/departments
        [HttpGet("departments")]
        public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetDepartments()
        {
            var result = await _service.GetAllDepartmentsAsync();
            return Ok(result);
        }

        // Endpoint: GET /api/organization/teams
        [HttpGet("teams")]
        public async Task<ActionResult<IEnumerable<TeamDto>>> GetTeams()
        {
            var result = await _service.GetAllTeamsWithMembersAsync();
            return Ok(result);
        }
        
        // Endpoint: GET /api/organization/employees
        [HttpGet("employees")]
        public async Task<ActionResult<IEnumerable<EmployeeSimpleDto>>> GetEmployees()
        {
            var result = await _service.GetAllEmployeesAsync();
            return Ok(result);
        }
    }
}