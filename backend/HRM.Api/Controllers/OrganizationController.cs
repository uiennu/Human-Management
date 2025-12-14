using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrganizationController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public OrganizationController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        /// <summary>
        /// Get all teams with members
        /// GET: /api/organization/teams
        /// </summary>
        /// <returns>200 OK with list of teams</returns>
        [HttpGet("teams")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<List<TeamResponseDto>>> GetAllTeams()
        {
            try
            {
                var teams = await _teamService.GetAllTeamsAsync();
                return Ok(teams);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllTeams: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving teams" });
            }
        }

        /// <summary>
        /// Add an employee to a team
        /// POST: /api/organization/teams/{id}/add-employee
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="dto">Request body containing employee ID</param>
        /// <returns>201 Created with employee ID on success</returns>
        [HttpPost("teams/{id}/add-employee")]
        [Authorize(Policy = "HROnly")]
        public async Task<ActionResult<AddEmployeeResponseDto>> AddEmployeeToTeam(int id, [FromBody] AddEmployeeToTeamDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid request format or missing employeeId" });
            }

            var (success, message, employeeId) = await _teamService.AddEmployeeToTeamAsync(id, dto.EmployeeId);

            if (!success)
            {
                // Map business errors to appropriate HTTP status codes
                if (message.Contains("not found"))
                {
                    return NotFound(new { message });
                }
                else if (message.Contains("already assigned") || message.Contains("locked") || message.Contains("inactive"))
                {
                    return Conflict(new { message });
                }
                else
                {
                    return StatusCode(500, new { message });
                }
            }

            var response = new AddEmployeeResponseDto
            {
                EmployeeId = employeeId!.Value
            };

            return Created($"/api/organization/teams/{id}/members/{employeeId}", response);
        }

        /// <summary>
        /// Remove an employee from a team
        /// DELETE: /api/organization/teams/{id}/remove-employee/{employeeId}
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="employeeId">Employee ID to remove</param>
        /// <returns>200 OK with success response on success</returns>
        [HttpDelete("teams/{id}/remove-employee/{employeeId}")]
        [Authorize(Policy = "HROnly")]
        public async Task<ActionResult<RemoveEmployeeResponseDto>> RemoveEmployeeFromTeam(int id, int employeeId)
        {
            if (id <= 0 || employeeId <= 0)
            {
                return BadRequest(new { message = "Invalid teamId or employeeId" });
            }

            var (success, message, data) = await _teamService.RemoveEmployeeFromTeamAsync(id, employeeId);

            if (!success)
            {
                // Map business errors to appropriate HTTP status codes
                if (message.Contains("not found"))
                {
                    return NotFound(new { message });
                }
                else if (message.Contains("not assigned") || message.Contains("not a member") || message.Contains("locked"))
                {
                    return Conflict(new { message });
                }
                else
                {
                    return StatusCode(500, new { message });
                }
            }

            var response = new RemoveEmployeeResponseDto
            {
                Success = true,
                Message = message,
                Data = data
            };

            return Ok(response);
        }

        /// <summary>
        /// Get list of employees not assigned to any team
        /// GET: /api/organization/unassigned-employees
        /// </summary>
        /// <returns>200 OK with list of unassigned employee IDs</returns>
        [HttpGet("unassigned-employees")]
        [Authorize(Policy = "HROnly")]
        public async Task<ActionResult<UnassignedEmployeesResponseDto>> GetUnassignedEmployees()
        {
            try
            {
                var unassignedEmployeeIds = await _teamService.GetUnassignedEmployeesAsync();

                var response = new UnassignedEmployeesResponseDto
                {
                    UnassignedEmployees = unassignedEmployeeIds
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetUnassignedEmployees: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving unassigned employees" });
            }
        }
        /// <summary>
        /// Get all roles
        /// GET: /api/organization/roles
        /// </summary>
        [HttpGet("roles")]
        [Authorize(Policy = "HROnly")]
        public async Task<ActionResult<List<RoleDto>>> GetAllRoles()
        {
            return Ok(await _teamService.GetAllRolesAsync());
        }

        /// <summary>
        /// Get all departments
        /// GET: /api/organization/departments
        /// </summary>
        [HttpGet("departments")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<List<DepartmentDto>>> GetAllDepartments()
        {
            return Ok(await _teamService.GetAllDepartmentsAsync());
        }

        /// <summary>
        /// Create a new team in a department
        /// POST: /api/organization/departments/{departmentId}/teams
        /// </summary>
        [HttpPost("departments/{departmentId}/teams")]
        [Authorize(Policy = "HROnly")]
        public async Task<ActionResult> CreateTeam(int departmentId, [FromBody] CreateSubTeamDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid request format" });
            }

            var (success, message, teamId) = await _teamService.CreateTeamAsync(departmentId, dto);

            if (!success)
            {
                // Map business errors
                if (message.Contains("not found"))
                {
                    return NotFound(new { message });
                }
                else
                {
                    return BadRequest(new { message });
                }
            }

            return Created($"/api/organization/teams/{teamId}", new { message, teamId });
        }

        /// <summary>
        /// Get all managers
        /// GET: /api/organization/managers
        /// </summary>
        [HttpGet("managers")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<List<ManagerDto>>> GetManagers()
        {
            return Ok(await _teamService.GetManagersAsync());
        }

        /// <summary>
        /// Get all employees
        /// GET: /api/organization/employees
        /// </summary>
        [HttpGet("employees")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<List<EmployeeListDto>>> GetAllEmployees()
        {
            return Ok(await _teamService.GetAllEmployeesAsync());
        }
    }
}
