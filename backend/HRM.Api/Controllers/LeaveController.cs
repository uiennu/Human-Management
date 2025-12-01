using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaveController : ControllerBase
    {
        private readonly ILeaveBalanceService _leaveBalanceService;
        private readonly ILeaveRequestService _leaveRequestService;
        private readonly IWorkHandoverService _workHandoverService;

        public LeaveController(
            ILeaveBalanceService leaveBalanceService,
            ILeaveRequestService leaveRequestService,
            IWorkHandoverService workHandoverService)
        {
            _leaveBalanceService = leaveBalanceService;
            _leaveRequestService = leaveRequestService;
            _workHandoverService = workHandoverService;
        }

        /// <summary>
        /// Extract current employee ID from JWT claims
        /// </summary>
        private int GetCurrentEmployeeId()
        {
            var employeeIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                  ?? User.FindFirst("EmployeeID");
            
            if (employeeIdClaim == null || !int.TryParse(employeeIdClaim.Value, out int employeeId))
            {
                return 0; // Not authenticated
            }

            return employeeId;
        }

        /// <summary>
        /// Get current employee's leave balance
        /// GET: /api/leave/leave-balances/me
        /// </summary>
        [HttpGet("leave-balances/me")]
        public async Task<ActionResult<LeaveBalanceResponseDto>> GetMyLeaveBalance()
        {
            int employeeId = GetCurrentEmployeeId();
            if (employeeId == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            var result = await _leaveBalanceService.GetMyLeaveBalanceAsync(employeeId);
            if (result == null)
            {
                return NotFound("Employee leave balance not found");
            }

            return Ok(result);
        }

        /// <summary>
        /// Create a new leave request
        /// POST: /api/leave/leave-requests
        /// </summary>
        [HttpPost("leave-requests")]
        public async Task<ActionResult<LeaveRequestResponseDto>> CreateLeaveRequest([FromBody] CreateLeaveRequestDto dto)
        {
            int employeeId = GetCurrentEmployeeId();
            if (employeeId == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _leaveRequestService.CreateLeaveRequestAsync(employeeId, dto);
            if (result.Status == "Error")
            {
                return BadRequest(result);
            }

            return Created($"/api/leave/leave-requests/{result.LeaveRequestID}", result);
        }

        /// <summary>
        /// Get paginated list of leave requests
        /// GET: /api/leave/leave-requests?page=1&size=10&status=Pending
        /// </summary>
        [HttpGet("leave-requests")]
        public async Task<ActionResult<PagedResultDto<LeaveRequestListItemDto>>> GetLeaveRequests(
            [FromQuery] int page = 1,
            [FromQuery] int size = 10,
            [FromQuery] string? status = null)
        {
            int employeeId = GetCurrentEmployeeId();
            if (employeeId == 0)
                return Unauthorized(new { message = "Employee not authenticated" });

            if (page < 1 || size < 1)
            {
                return BadRequest("Page and size must be greater than 0");
            }

            var result = await _leaveRequestService.GetLeaveRequestsAsync(employeeId, status, page, size);
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
            int employeeId = GetCurrentEmployeeId();
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
                newStatus = "Cancelled"
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

            int managerId = GetCurrentEmployeeId();
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
            int employeeId = GetCurrentEmployeeId();
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
            int managerId = GetCurrentEmployeeId();
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
