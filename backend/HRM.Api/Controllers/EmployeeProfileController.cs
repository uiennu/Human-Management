using HRM.Api.DTOs;
using HRM.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HRM.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/employees/me")]
    [Authorize(Policy = "EmployeeOnly")]
    public class EmployeeProfileController : ControllerBase
    {
        private readonly IEmployeeProfileService _service;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<EmployeeProfileController> _logger;
        private readonly AppDbContext _context;
        private readonly IEventReplayService _replayService;
        
        public EmployeeProfileController(
            IEmployeeProfileService service,
            ICurrentUserService currentUserService,
            ILogger<EmployeeProfileController> logger,
            AppDbContext context,
            IEventReplayService replayService)
        {
            _service = service;
            _currentUserService = currentUserService;
            _logger = logger;
            _context = context;
            _replayService = replayService;
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
        [Authorize(Policy = "EmployeeOnly")]
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
        /// Supports optional file uploads for supporting documents (ID card photos, bank statements, etc.)
        /// Maximum 5 files, 10MB total
        /// </summary>
        [HttpPost("sensitive-update-requests")]
        [Authorize(Policy = "EmployeeOnly")]
        public async Task<IActionResult> RequestSensitiveUpdate(
            [FromForm] SensitiveUpdateRequestDto dto,
            [FromForm] List<IFormFile>? supportingDocuments = null)
        {
            try
            {
                var employeeId = _currentUserService.GetCurrentEmployeeId();
                if (employeeId == 0)
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var result = await _service.CreateSensitiveUpdateRequestAsync(employeeId, dto, supportingDocuments);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
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
        [Authorize(Policy = "EmployeeOnly")]
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

        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetHistory(int id)
        {
            // Query trực tiếp từ bảng EventStore
            var history = await _context.EmployeeEvents
                .Where(e => e.AggregateID == id)
                .OrderByDescending(e => e.SequenceNumber) // Mới nhất xếp trên
                .Select(e => new
                {
                    EventID = e.EventID,
                    EventName = e.EventType,
                    Data = e.EventData, // Frontend sẽ parse JSON này để hiển thị chi tiết
                    Time = e.CreatedAt,
                    SequenceNumber = e.SequenceNumber,
                    EventVersion = e.EventVersion
                })
                .ToListAsync();

            return Ok(history);
        }

        /// <summary>
        /// Replay events to reconstruct employee state
        /// </summary>
        [HttpPost("{id}/replay")]
        public async Task<IActionResult> ReplayEvents(int id, [FromQuery] int? upToSequence = null)
        {
            try
            {
                _logger.LogInformation($"Replaying events for employee {id} up to sequence {upToSequence?.ToString() ?? "latest"}");
                
                var result = await _replayService.ReplayEventsAsync(id, upToSequence);
                
                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message });
                }

                // Return reconstructed state
                return Ok(new
                {
                    success = true,
                    message = result.Message,
                    employee = new
                    {
                        employeeId = result.ReconstructedEmployee.EmployeeID,
                        fullName = $"{result.ReconstructedEmployee.FirstName} {result.ReconstructedEmployee.LastName}",
                        email = result.ReconstructedEmployee.Email,
                        phone = result.ReconstructedEmployee.Phone,
                        address = result.ReconstructedEmployee.Address,
                        personalEmail = result.ReconstructedEmployee.PersonalEmail,
                        bankAccount = result.ReconstructedEmployee.BankAccountNumber,
                        taxId = result.ReconstructedEmployee.TaxID,
                        avatarUrl = result.ReconstructedEmployee.AvatarUrl,
                        hireDate = result.ReconstructedEmployee.HireDate,
                        emergencyContacts = result.ReconstructedEmployee.EmergencyContacts?.Select(c => new
                        {
                            name = c.Name,
                            phone = c.Phone,
                            relation = c.Relation
                        }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error replaying events for employee {id}");
                return StatusCode(500, new { message = "An error occurred while replaying events" });
            }
        }

        [HttpPost("avatar")]
        [Authorize] // Bắt buộc phải đăng nhập
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            try
            {
                // Lấy ID nhân viên đang đăng nhập từ Token
                // Lưu ý: Đảm bảo bạn có extension method GetUserId() hoặc lấy từ User.Claims
                var userIdClaim = User.FindFirst("EmployeeID")?.Value
                                  ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

                int employeeId = int.Parse(userIdClaim);

                // Gọi Service xử lý
                var newAvatarUrl = await _service.UploadAvatarAsync(employeeId, file);

                // Trả về URL để Frontend hiển thị ngay lập tức
                // Cần ghép với Base URL của server để thành link đầy đủ
                var request = HttpContext.Request;
                var baseUrl = $"{request.Scheme}://{request.Host}";
                var fullUrl = $"{baseUrl}{newAvatarUrl}";

                return Ok(new { url = fullUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
