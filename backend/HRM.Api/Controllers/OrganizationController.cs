using HRM.Api.Services;
using Microsoft.AspNetCore.Mvc;
using HRM.Api.DTOs.Organization;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/organization")]
    public class OrganizationController : ControllerBase
    {
        private readonly IOrganizationService _service;
        private readonly ITeamService _teamService;

        public OrganizationController(IOrganizationService service, ITeamService teamService)
        {
            _service = service;
            _teamService = teamService;
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

        [HttpPost("adddepartment")]
        public async Task<IActionResult> AddDepartment([FromBody] CreateDepartmentDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _service.AddDepartmentAsync(request);
            if (result.Success) return StatusCode(201, new { success = true, message = result.Message, data = result.Data });
            
            if (result.Message.Contains("required") || result.Message.Contains("exists"))
                return BadRequest(new { success = false, message = result.Message });

            return StatusCode(500, new { success = false, message = result.Message });
        }
        

        [HttpDelete("deletedepartment/{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var result = await _service.DeleteDepartmentAsync(id);
            if (result.Success) return Ok(new { success = true, message = result.Message });
            if (result.Message == "Department not found.") return NotFound(new { success = false, message = result.Message });
            if (result.Message.StartsWith("Conflict")) return Conflict(new { success = false, message = result.Message });
            return StatusCode(500, new { success = false, message = result.Message });
        }

        [HttpDelete("deleteteam/{id}")]
        public async Task<IActionResult> DeleteTeam(int id)
        {
            var result = await _service.DeleteTeamAsync(id);
            if (result.Success) return Ok(new { success = true, message = result.Message, teamId = result.TeamId });
            if (result.Message == "Team not found.") return NotFound(new { success = false, message = result.Message });
            if (result.Message.StartsWith("Conflict")) return Conflict(new { success = false, message = result.Message });
            return StatusCode(500, new { success = false, message = result.Message });
        }

        // API lấy danh sách Departments (Dropdown)
        [HttpGet("departments")]
        public async Task<IActionResult> GetAllDepartments()
        {
            try 
            {
                var result = await _teamService.GetAllDepartmentsAsync(); 
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // API lấy danh sách Teams
        [HttpGet("teams")]
        public async Task<IActionResult> GetAllTeams()
        {
            try
            {
                var result = await _teamService.GetAllTeamsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // API lấy danh sách Employees
        [HttpGet("employees")]
        public async Task<IActionResult> GetAllEmployees()
        {
            try
            {
                var result = await _teamService.GetAllEmployeesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
        
        // API lấy nhân viên chưa có nhóm
        [HttpGet("unassigned-employees")]
        public async Task<IActionResult> GetUnassignedEmployees()
        {
             try
            {
                var result = await _teamService.GetUnassignedEmployeesAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}