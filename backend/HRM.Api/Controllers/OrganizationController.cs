using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
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
        private readonly ITeamService _teamService;

        public OrganizationController(IOrganizationService service, ITeamService teamService)
        {
            _service = service;
            _teamService = teamService;
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
        
        [HttpGet("employees")]
        public async Task<ActionResult<IEnumerable<EmployeeSimpleDto>>> GetEmployees()
        {
            var result = await _service.GetAllEmployeesAsync();
            return Ok(result);
        }

        // Endpoint: GET /api/organization/subordinates
        [Authorize]
        [HttpGet("subordinates")]
        public async Task<ActionResult<IEnumerable<EmployeeSimpleDto>>> GetSubordinates()
        {
            var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("id")?.Value 
                        ?? User.FindFirst("sub")?.Value
                        ?? User.FindFirst("EmployeeID")?.Value;

            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var result = await _service.GetSubordinatesAsync(userId);
            return Ok(result);
        }

        // ==========================================
        // RESTORED ENDPOINTS
        // ==========================================

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

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
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

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
        [HttpDelete("deletedepartment/{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var result = await _service.DeleteDepartmentAsync(id);
            if (result.Success) return Ok(new { success = true, message = result.Message });
            if (result.Message == "Department not found.") return NotFound(new { success = false, message = result.Message });
            if (result.Message.StartsWith("Conflict")) return Conflict(new { success = false, message = result.Message });
            return StatusCode(500, new { success = false, message = result.Message });
        }

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
        [HttpDelete("deleteteam/{id}")]
        public async Task<IActionResult> DeleteTeam(int id)
        {
            var result = await _service.DeleteTeamAsync(id);
            if (result.Success) return Ok(new { success = true, message = result.Message, teamId = result.TeamId });
            if (result.Message == "Team not found.") return NotFound(new { success = false, message = result.Message });
            if (result.Message.StartsWith("Conflict")) return Conflict(new { success = false, message = result.Message });
            return StatusCode(500, new { success = false, message = result.Message });
        }

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
        [HttpPost("addteam/{departmentId}")]
        public async Task<IActionResult> AddTeam(int departmentId, [FromBody] CreateSubTeamDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _teamService.CreateTeamAsync(departmentId, request);
            if (result.Success) return StatusCode(201, new { success = true, message = result.Message, teamId = result.TeamId });
            
            if (result.Message.Contains("not found")) return NotFound(new { success = false, message = result.Message });
            
            return StatusCode(500, new { success = false, message = result.Message });
        }

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
        [HttpPut("teams/{teamId}")]
        public async Task<IActionResult> UpdateTeam(int teamId, [FromBody] UpdateSubTeamDto request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _teamService.UpdateTeamAsync(teamId, request);
            if (result.Success) return Ok(new { success = true, message = result.Message });

            if (result.Message.Contains("not found")) return NotFound(new { success = false, message = result.Message });

            return StatusCode(500, new { success = false, message = result.Message });
        }

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
        [HttpDelete("teams/{teamId}/employees/{employeeId}")]
        public async Task<IActionResult> RemoveEmployeeFromTeam(int teamId, int employeeId)
        {
            var result = await _teamService.RemoveEmployeeFromTeamAsync(teamId, employeeId);
            
            if (result.Success)
            {
                return Ok(new { success = true, message = result.Message, data = result.Data });
            }
            
            if (result.Message.Contains("not found"))
            {
                return NotFound(new { success = false, message = result.Message });
            }
            
            return StatusCode(500, new { success = false, message = result.Message });
        }

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
        [HttpPost("teams/{teamId}/add-employee")]
        public async Task<IActionResult> AddEmployeeToTeam(int teamId, [FromBody] AddEmployeeToTeamDto request)
        {
            if (request == null || request.EmployeeId <= 0)
                return BadRequest(new { success = false, message = "Invalid employee ID" });

            var result = await _teamService.AddEmployeeToTeamAsync(teamId, request.EmployeeId);
            
            if (result.Success)
                return Ok(new { success = true, message = result.Message, employeeId = result.EmployeeId });
            
            return BadRequest(new { success = false, message = result.Message });
        }

        [Authorize(Roles = "Admin,HR Manager,HR Employee")]
        [HttpPost("move-employee")]
        public async Task<IActionResult> MoveEmployee([FromBody] MoveEmployeeDto request)
        {
            if (request == null || request.EmployeeId <= 0 || request.TargetTeamId <= 0)
                return BadRequest(new { success = false, message = "Invalid request data" });

            var result = await _teamService.MoveEmployeeAsync(request.EmployeeId, request.TargetTeamId);
            if (result.Success) return Ok(new { success = true, message = result.Message });
            if (result.Message.Contains("not found")) return NotFound(new { success = false, message = result.Message });
            return BadRequest(new { success = false, message = result.Message });
        }

        [HttpPut("departments/{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, [FromBody] UpdateDepartmentDto request)
        {
            if (request == null)
                return BadRequest("Invalid data");
            int userId = 1;
            await _service.UpdateDepartmentAsync(id, request, userId);
            return Ok(new { message = "Update successful" });
        }

        [HttpGet("logs")]
        public async Task<IActionResult> GetOrganizationLogs()
        {
            try
            {
                var logs = await _service.GetOrganizationLogsAsync();
                return Ok(logs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}