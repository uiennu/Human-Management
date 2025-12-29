using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRM.Api.Controllers
{
    /// <summary>
    /// Controller for HR to manage sensitive information update requests
    /// </summary>
    [ApiController]
    [Route("api/hr/sensitive-requests")]
    [Authorize(Policy = "HROnly")]
    public class HrSensitiveRequestController : ControllerBase
    {
        private readonly ISensitiveRequestService _service;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<HrSensitiveRequestController> _logger;

        public HrSensitiveRequestController(
            ISensitiveRequestService service,
            ICurrentUserService currentUserService,
            ILogger<HrSensitiveRequestController> logger)
        {
            _service = service;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        /// <summary>
        /// Get all sensitive update requests (with optional filtering)
        /// GET: /api/hr/sensitive-requests?status=Pending&page=1&pageSize=10
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllRequests(
            [FromQuery] string? status = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null)
        {
            try
            {
                var currentUserId = _currentUserService.GetCurrentEmployeeId();
                if (currentUserId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.GetAllSensitiveRequestsAsync(currentUserId, status, page, pageSize, search);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sensitive requests");
                return StatusCode(500, new { message = "An error occurred while fetching requests" });
            }
        }

        /// <summary>
        /// Get a specific sensitive request by ID
        /// GET: /api/hr/sensitive-requests/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequestById(int id)
        {
            try
            {
                var currentUserId = _currentUserService.GetCurrentEmployeeId();
                if (currentUserId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.GetSensitiveRequestByIdAsync(id, currentUserId);
                
                if (result == null)
                {
                    return NotFound(new { message = "Request not found" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sensitive request {RequestId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the request" });
            }
        }

        /// <summary>
        /// Approve a sensitive update request
        /// POST: /api/hr/sensitive-requests/{id}/approve
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveRequest(int id, [FromBody] ProcessRequestBodyDto? body = null)
        {
            try
            {
                var approverId = _currentUserService.GetCurrentEmployeeId();
                if (approverId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.ProcessRequestAsync(id, "Approve", approverId, body?.Reason);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving sensitive request {RequestId}", id);
                return StatusCode(500, new { message = "An error occurred while processing the request" });
            }
        }

        /// <summary>
        /// Reject a sensitive update request
        /// POST: /api/hr/sensitive-requests/{id}/reject
        /// </summary>
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectRequest(int id, [FromBody] ProcessRequestBodyDto body)
        {
            try
            {
                if (string.IsNullOrEmpty(body?.Reason))
                {
                    return BadRequest(new { message = "Rejection reason is required" });
                }

                var approverId = _currentUserService.GetCurrentEmployeeId();
                if (approverId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.ProcessRequestAsync(id, "Reject", approverId, body.Reason);

                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting sensitive request {RequestId}", id);
                return StatusCode(500, new { message = "An error occurred while processing the request" });
            }
        }

        /// <summary>
        /// [DEV ONLY] Insert test data for sensitive requests
        /// POST: /api/hr/sensitive-requests/test-data
        /// </summary>
        [HttpPost("test-data")]
        [AllowAnonymous]
        public async Task<IActionResult> InsertTestData(
            [FromServices] Data.AppDbContext context,
            [FromServices] IWebHostEnvironment env)
        {
            // Only allow in Development environment
            if (!env.IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                // Test cases covering all role levels
                var testData = new List<Models.EmployeeProfileChange>
                {
                    // Level 1 employees
                    new() { EmployeeID = 4, FieldName = "BankAccountNumber", OldValue = "5566778899", NewValue = "DAVID-NEW-BANK-001", Status = "Pending" },
                    new() { EmployeeID = 11, FieldName = "PersonalEmail", OldValue = "liam.personal@gmail.com", NewValue = "liam.new@gmail.com", Status = "Pending" },
                    // Level 1 managers
                    new() { EmployeeID = 3, FieldName = "TaxID", OldValue = "TAX-CHARLIE", NewValue = "NEW-TAX-CHARLIE", Status = "Pending" },
                    new() { EmployeeID = 6, FieldName = "BankAccountNumber", OldValue = "6655443322", NewValue = "FRANK-NEW-BANK", Status = "Pending" },
                    // Level 2 HR Employees
                    new() { EmployeeID = 5, FieldName = "BankAccountNumber", OldValue = "9988776655", NewValue = "EVE-NEW-BANK-001", Status = "Pending" },
                    new() { EmployeeID = 9, FieldName = "PersonalEmail", OldValue = "ivy.personal@gmail.com", NewValue = "ivy.new@gmail.com", Status = "Pending" },
                    // Level 3 HR Manager  
                    new() { EmployeeID = 2, FieldName = "TaxID", OldValue = "TAX-BOB", NewValue = "NEW-TAX-BOB", Status = "Pending" },
                    // Level 4 Admin
                    new() { EmployeeID = 1, FieldName = "BankAccountNumber", OldValue = "123456789", NewValue = "ALICE-NEW-BANK-001", Status = "Pending" }
                };

                // Clear existing pending requests first
                var existingPending = context.EmployeeProfileChanges.Where(c => c.Status == "Pending");
                context.EmployeeProfileChanges.RemoveRange(existingPending);
                await context.SaveChangesAsync();

                // Insert new test data
                context.EmployeeProfileChanges.AddRange(testData);
                await context.SaveChangesAsync();

                return Ok(new { 
                    success = true, 
                    message = $"Inserted {testData.Count} test records",
                    data = testData.Select(d => new { d.EmployeeID, d.FieldName, d.NewValue })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inserting test data");
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }

    /// <summary>
    /// DTO for request body when processing (approve/reject) a request
    /// </summary>
    public class ProcessRequestBodyDto
    {
        public string? Reason { get; set; }
    }
}
