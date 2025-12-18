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

        [HttpPost("adddepartment")]
        public async Task<IActionResult> AddDepartment([FromBody] CreateDepartmentDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _service.AddDepartmentAsync(request);
            
            if (result.Success) return StatusCode(201, new { success = true, message = result.Message });
            return BadRequest(new { success = false, message = result.Message });
        }

        // API XÓA
        [HttpDelete("deletedepartment/{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var result = await _service.DeleteDepartmentAsync(id);
            if (result.Success) return Ok(new { success = true, message = result.Message });
            if (result.Message == "Department not found.") return NotFound(new { success = false, message = result.Message });
            return StatusCode(500, new { success = false, message = result.Message });
        }
    }
}