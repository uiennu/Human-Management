using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Mvc;
using HRM.Api.Constants;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaveController : ControllerBase
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly ILeaveBalanceService _leaveBalanceService;
        private readonly ILeaveRequestService _leaveRequestService;
        private readonly IWorkHandoverService _workHandoverService;

        public LeaveController(
            ICurrentUserService currentUserService,
            ILeaveBalanceService leaveBalanceService,
            ILeaveRequestService leaveRequestService,
            IWorkHandoverService workHandoverService)
        {
            _currentUserService = currentUserService;
            _leaveBalanceService = leaveBalanceService;
            _leaveRequestService = leaveRequestService;
            _workHandoverService = workHandoverService;
        }



        /// <summary>
        /// Get all leave types
        /// GET: /api/leave/types
        /// </summary>
        [HttpGet("types")]
        public async Task<ActionResult<List<LeaveTypeDto>>> GetLeaveTypes()
        {
            var types = await _leaveRequestService.GetLeaveTypesAsync();
            return Ok(types);
        }

        /// <summary>
        /// Get employee's leave balance
        /// GET: /api/leave/balances/{employeeId}
        /// </summary>
        [HttpGet("balances/{employeeId}")]
        public async Task<ActionResult<LeaveBalanceResponseDto>> GetMyLeaveBalance(int employeeId)
        {
            // Use the provided employeeId directly (for querying other employees' balances)
            if (employeeId <= 0)
                return BadRequest("Invalid employee ID");

            var result = await _leaveBalanceService.GetMyLeaveBalanceAsync(employeeId);
            if (result == null)
            {
                return NotFound("Employee leave balance not found");
            }

            return Ok(result);
        }

        /// <summary>
        /// Create a new leave request
        /// POST: /api/leave/request
        /// </summary>
        [HttpPost("request")]
        public async Task<ActionResult<LeaveRequestResponseDto>> CreateLeaveRequest(
            [FromForm] CreateLeaveRequestDto dto,
            [FromQuery] int? employeeId = null) // For development - remove when auth is implemented
        {
            var id = employeeId ?? _currentUserService.GetCurrentEmployeeId();
            if (id == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _leaveRequestService.CreateLeaveRequestAsync(id, dto);
            if (result.Status == "Error")
            {
                return BadRequest(result);
            }

            return Created($"/api/leave/request/{result.LeaveRequestID}", result);
        }

        /// <summary>
        /// Get paginated list of leave requests
        /// GET: /api/leave/requests
        /// </summary>
        [HttpGet("requests")]
        public async Task<ActionResult<PagedResultDto<LeaveRequestListItemDto>>> GetLeaveRequests(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] string? dateRange = null,
            [FromQuery] int? leaveTypeId = null,
            [FromQuery] int? employeeId = null) // For development - remove when auth is implemented
        {
            // Use provided employeeId for development, otherwise get from auth
            var id = employeeId ?? _currentUserService.GetCurrentEmployeeId();
            if (id == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            if (page < 1 || pageSize < 1)
            {
                return BadRequest("Page and size must be greater than 0");
            }

            var result = await _leaveRequestService.GetLeaveRequestsAsync(id, status, dateRange, leaveTypeId, page, pageSize);
            return Ok(result);
        }

        /// <summary>
        /// Get leave request detail
        /// GET: /api/leave/leave-requests/{id}
        /// </summary>
        [HttpGet("leave-requests/{id}")]
        public async Task<ActionResult<LeaveRequestDetailDto>> GetLeaveRequestDetail(int id)
        {
            var result = await _leaveRequestService.GetLeaveRequestDetailAsync(id);
            if (result == null)
            {
                return NotFound("Leave request not found");
            }

            return Ok(result);
        }

        /// <summary>
        /// Cancel a leave request
        /// PUT: /api/leave/leave-requests/{id}/cancel
        /// </summary>
        [HttpPut("leave-requests/{id}/cancel")]
        public async Task<ActionResult> CancelLeaveRequest(int id)
        {
            var employeeId = _currentUserService.GetCurrentEmployeeId();
            if (employeeId == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            var (success, message) = await _leaveRequestService.CancelLeaveRequestAsync(id, employeeId);
            if (!success)
            {
                return BadRequest(new { success = false, message });
            }

            return Ok(new
            {
                success = true,
                message,
                leaveRequestId = id,
                newStatus = LeaveStatus.Cancelled
            });
        }

        // ==================== WORK HANDOVER ENDPOINTS ====================

        /// <summary>
        /// Create a work handover for a leave request
        /// POST: /api/leave/work-handovers
        /// </summary>
        [HttpPost("work-handovers")]
        public async Task<ActionResult<WorkHandoverDto>> CreateWorkHandover([FromBody] CreateWorkHandoverDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var managerId = _currentUserService.GetCurrentEmployeeId();
            if (managerId == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            try
            {
                var result = await _workHandoverService.CreateWorkHandoverAsync(managerId, dto);
                return Created($"/api/leave/work-handovers/{result.HandoverID}", result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all handovers for a specific leave request
        /// GET: /api/leave/leave-requests/{leaveRequestId}/handovers
        /// </summary>
        [HttpGet("leave-requests/{leaveRequestId}/handovers")]
        public async Task<ActionResult<List<WorkHandoverDto>>> GetHandoversByLeaveRequest(int leaveRequestId)
        {
            var result = await _workHandoverService.GetHandoversByLeaveRequestAsync(leaveRequestId);
            return Ok(result);
        }

        /// <summary>
        /// Get my handovers (as assignee or manager)
        /// GET: /api/leave/my-handovers
        /// </summary>
        [HttpGet("my-handovers")]
        public async Task<ActionResult<List<WorkHandoverDto>>> GetMyHandovers()
        {
            var employeeId = _currentUserService.GetCurrentEmployeeId();
            if (employeeId == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            var result = await _workHandoverService.GetMyHandoversAsync(employeeId);
            return Ok(result);
        }

        /// <summary>
        /// Get work handover details
        /// GET: /api/leave/work-handovers/{id}
        /// </summary>
        [HttpGet("work-handovers/{id}")]
        public async Task<ActionResult<WorkHandoverDto>> GetWorkHandoverDetail(int id)
        {
            var result = await _workHandoverService.GetHandoverDetailAsync(id);
            if (result == null)
            {
                return NotFound("Work handover not found");
            }

            return Ok(result);
        }

        /// <summary>
        /// Delete a work handover
        /// DELETE: /api/leave/work-handovers/{id}
        /// </summary>
        [HttpDelete("work-handovers/{id}")]
        public async Task<ActionResult> DeleteWorkHandover(int id)
        {
            var managerId = _currentUserService.GetCurrentEmployeeId();
            if (managerId == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            var success = await _workHandoverService.DeleteHandoverAsync(id, managerId);
            if (!success)
            {
                return BadRequest(new { message = "Cannot delete handover. You may not have permission." });
            }

            return Ok(new { message = "Work handover deleted successfully" });
        }
    }
}
