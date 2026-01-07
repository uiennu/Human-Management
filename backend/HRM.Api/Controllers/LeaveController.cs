using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Mvc;
using HRM.Api.Constants;
using Microsoft.AspNetCore.Authorization;
using HRM.Api.Data;

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



        [HttpGet("types")]
        public async Task<ActionResult<List<LeaveTypeDto>>> GetLeaveTypes()
        {
            var types = await _leaveRequestService.GetLeaveTypesAsync();
            return Ok(types);
        }

        [HttpGet("primary-approver")]
        public async Task<ActionResult> GetPrimaryApprover([FromQuery] int? employeeId = null)
        {
            var id = employeeId ?? _currentUserService.GetCurrentEmployeeId();
            if (id == 0) return Unauthorized(new { message = "Employee not authenticated" });

            var name = await _leaveRequestService.GetPrimaryApproverNameAsync(id);
            if (string.IsNullOrEmpty(name)) return NotFound(new { message = "Manager not found" });

            return Ok(new { managerName = name });
        }

        [HttpGet("balances/{employeeId}")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<LeaveBalanceResponseDto>> GetMyLeaveBalance(int employeeId)
        {
            var currentEmployeeId = _currentUserService.GetCurrentEmployeeId();
            var roles = _currentUserService.GetCurrentUserRoles();

            if (currentEmployeeId == 0) return Unauthorized(new { message = "Employee not authenticated" });

            bool isPrivilegedUser = roles.Any(r => r == "Admin" || r == "HR Manager" || r == "HR Employee");

            if (!isPrivilegedUser && employeeId != currentEmployeeId)
            {
                return Forbid();
            }

            var result = await _leaveBalanceService.GetMyLeaveBalanceAsync(employeeId);
            if (result == null) return NotFound("Employee leave balance not found");

            return Ok(result);
        }

        [HttpPost("request")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<LeaveRequestResponseDto>> CreateLeaveRequest(
            [FromForm] CreateLeaveRequestDto dto,
            [FromQuery] int? employeeId = null)
        {
            var id = employeeId ?? _currentUserService.GetCurrentEmployeeId();
            if (id == 0) return Unauthorized(new { message = "Employee not authenticated" });

            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _leaveRequestService.CreateLeaveRequestAsync(id, dto);
            if (result.Status == "Error") return BadRequest(result);

            return Created($"/api/leave/request/{result.LeaveRequestID}", result);
        }

        [HttpGet("requests")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<PagedResultDto<LeaveRequestListItemDto>>> GetLeaveRequests(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null,
            [FromQuery] string? dateRange = null,
            [FromQuery] int? leaveTypeId = null,
            [FromQuery] int? employeeId = null)
        {
            var id = employeeId ?? _currentUserService.GetCurrentEmployeeId();
            if (id == 0) return Unauthorized(new { message = "Employee not authenticated" });

            var result = await _leaveRequestService.GetLeaveRequestsAsync(id, status, dateRange, leaveTypeId, page, pageSize);
            return Ok(result);
        }

        [HttpGet("leave-requests/{id}")]
        public async Task<ActionResult<LeaveRequestDetailDto>> GetLeaveRequestDetail(int id)
        {
            var result = await _leaveRequestService.GetLeaveRequestDetailAsync(id);
            if (result == null) return NotFound("Leave request not found");
            return Ok(result);
        }

        [HttpPut("leave-requests/{id}/cancel")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult> CancelLeaveRequest(int id)
        {
            var employeeId = _currentUserService.GetCurrentEmployeeId();
            if (employeeId == 0) return Unauthorized(new { message = "Employee not authenticated" });

            var (success, message) = await _leaveRequestService.CancelLeaveRequestAsync(id, employeeId);
            if (!success) return BadRequest(new { success = false, message });

            return Ok(new { success = true, message, leaveRequestId = id, newStatus = LeaveStatus.Cancelled });
        }

        // --- NEW ENDPOINTS: APPROVE & REJECT (MOVED FROM JAVA) ---

        [HttpPost("leave-requests/{id}/approve")]
        // [Authorize(Policy = "ManagerOnly")] // Uncomment khi cần check quyền
        public async Task<ActionResult> ApproveLeaveRequest(int id, [FromBody] ApprovalRequestDto dto)
        {
            var managerId = _currentUserService.GetCurrentEmployeeId();
            
            var (success, message) = await _leaveRequestService.ApproveLeaveRequestAsync(id, managerId, dto.Note);
            
            if (!success) return BadRequest(new { message });

            return Ok(new { message });
        }

        [HttpPost("leave-requests/{id}/reject")]
        // [Authorize(Policy = "ManagerOnly")] 
        public async Task<ActionResult> RejectLeaveRequest(int id, [FromBody] ApprovalRequestDto dto)
        {
            var managerId = _currentUserService.GetCurrentEmployeeId();
            
            var (success, message) = await _leaveRequestService.RejectLeaveRequestAsync(id, managerId, dto.Note);
            
            if (!success) return BadRequest(new { message });

            return Ok(new { message });
        }

        public class ApprovalRequestDto 
        {
            public string? Note { get; set; }
        }
        // ---------------------------------------------------------

        // Work Handover Endpoints (Giữ nguyên)
        [HttpPost("work-handovers")]
        [Authorize(Policy = "ManagerOnly")]
        public async Task<ActionResult<WorkHandoverDto>> CreateWorkHandover([FromBody] CreateWorkHandoverDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var managerId = _currentUserService.GetCurrentEmployeeId();
            if (managerId == 0) return Unauthorized(new { message = "Employee not authenticated" });

            try
            {
                var result = await _workHandoverService.CreateWorkHandoverAsync(managerId, dto);
                return Created($"/api/leave/work-handovers/{result.HandoverID}", result);
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpGet("leave-requests/{leaveRequestId}/handovers")]
        public async Task<ActionResult<List<WorkHandoverDto>>> GetHandoversByLeaveRequest(int leaveRequestId)
        {
            var result = await _workHandoverService.GetHandoversByLeaveRequestAsync(leaveRequestId);
            return Ok(result);
        }

        [HttpGet("my-handovers")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<ActionResult<List<WorkHandoverDto>>> GetMyHandovers()
        {
            var employeeId = _currentUserService.GetCurrentEmployeeId();
            if (employeeId == 0) return Unauthorized(new { message = "Employee not authenticated" });
            var result = await _workHandoverService.GetMyHandoversAsync(employeeId);
            return Ok(result);
        }

        [HttpGet("work-handovers/{id}")]
        public async Task<ActionResult<WorkHandoverDto>> GetWorkHandoverDetail(int id)
        {
            var result = await _workHandoverService.GetHandoverDetailAsync(id);
            if (result == null) return NotFound("Work handover not found");
            return Ok(result);
        }

        [HttpDelete("work-handovers/{id}")]
        [Authorize(Policy = "ManagerOnly")]
        public async Task<ActionResult> DeleteWorkHandover(int id)
        {
            var managerId = _currentUserService.GetCurrentEmployeeId();
            if (managerId == 0) return Unauthorized(new { message = "Employee not authenticated" });
            var success = await _workHandoverService.DeleteHandoverAsync(id, managerId);
            if (!success) return BadRequest(new { message = "Cannot delete handover." });
            return Ok(new { message = "Deleted successfully" });
        }

        [HttpGet("employee/{employeeId}")]
        [Authorize(Policy = "ManagerOnly")]
        public async Task<IActionResult> GetEmployeeLeaveRequests(
            int employeeId,
            [FromQuery] string? status = null,
            [FromQuery] string? dateRange = null,
            [FromQuery] int? leaveTypeId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (employeeId <= 0) return BadRequest(new { message = "Invalid employee ID" });
            var result = await _leaveRequestService.GetLeaveRequestsAsync(employeeId, status, dateRange, leaveTypeId, page, pageSize);
            return Ok(result);
        }
    }
}