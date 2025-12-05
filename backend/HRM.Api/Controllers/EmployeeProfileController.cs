using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/employees/me")]
    [Authorize]
    public class EmployeeProfileController : ControllerBase
    {
        private readonly IEmployeeProfileService _service;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<EmployeeProfileController> _logger;

        public EmployeeProfileController(   
            IEmployeeProfileService service,
            ICurrentUserService currentUserService,
            ILogger<EmployeeProfileController> logger)
        {
            _service = service;
            _currentUserService = currentUserService;
            _logger = logger;
        }

        /// <summary>
        /// Get current employee's profile information
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var employeeId = _currentUserService.GetCurrentEmployeeId();
                _logger.LogInformation($"[GetMyProfile] Request received. EmployeeID: {employeeId}");

                if (employeeId == 0)
                {
                    _logger.LogWarning("[GetMyProfile] User not authenticated (EmployeeID is 0)");
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var profile = await _service.GetMyProfileAsync(employeeId);
                if (profile == null)
                {
                    _logger.LogWarning($"[GetMyProfile] Profile not found for EmployeeID: {employeeId}");
                    return NotFound(new { message = "Employee profile not found" });
                }

                _logger.LogInformation($"[GetMyProfile] Profile found for {profile.FullName}");
                return Ok(profile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employee profile");
                return StatusCode(500, new { message = "An error occurred while retrieving profile" });
            }
        }

        /// <summary>
        /// Update basic information (phone, address, personal email, emergency contact)
        /// </summary>
        [HttpPut("basic-info")]
        public async Task<IActionResult> UpdateBasicInfo([FromBody] UpdateBasicInfoDto dto)
        {
            try
            {
                var employeeId = _currentUserService.GetCurrentEmployeeId();
                if (employeeId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.UpdateBasicInfoAsync(employeeId, dto);
                
                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating basic info");
                return StatusCode(500, new { message = "An error occurred while updating basic information" });
            }
        }

        /// <summary>
        /// Request to update sensitive information (Tax ID/CCCD, Bank Account)
        /// This will generate and send an OTP to the employee's email
        /// </summary>
        [HttpPost("sensitive-update-requests")]
        public async Task<IActionResult> RequestSensitiveUpdate([FromBody] SensitiveUpdateRequestDto dto)
        {
            try
            {
                var employeeId = _currentUserService.GetCurrentEmployeeId();
                if (employeeId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.CreateSensitiveUpdateRequestAsync(employeeId, dto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating sensitive update request");
                return StatusCode(500, new { message = "An error occurred while processing your request" });
            }
        }

        /// <summary>
        /// Verify OTP and submit sensitive information change request to HR for approval
        /// </summary>
        [HttpPost("sensitive-update-requests/verify")]
        public async Task<IActionResult> VerifySensitiveOtp([FromBody] VerifyOtpDto dto)
        {
            try
            {
                var employeeId = _currentUserService.GetCurrentEmployeeId();
                if (employeeId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.VerifyOtpAndSubmitAsync(employeeId, dto);
                
                if (!result.Success)
                {
                    return BadRequest(result);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying OTP");
                return StatusCode(500, new { message = "An error occurred while verifying OTP" });
            }
        }
    }
}
