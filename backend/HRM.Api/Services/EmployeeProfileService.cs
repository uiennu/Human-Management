using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;
using HRM.Api.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Services
{
    public interface IEmployeeProfileService
    {
        Task<MyProfileResponseDto?> GetMyProfileAsync(int employeeId);
        Task<UpdateResultDto> UpdateBasicInfoAsync(int employeeId, UpdateBasicInfoDto dto);
        Task<SensitiveRequestResponseDto> CreateSensitiveUpdateRequestAsync(int employeeId, SensitiveUpdateRequestDto dto);
        Task<VerifyOtpResultDto> VerifyOtpAndSubmitAsync(int employeeId, VerifyOtpDto dto);
    }

    public class EmployeeProfileService : BaseService,IEmployeeProfileService
    {
        private readonly IEmployeeProfileRepository _employeeRepository;
        private readonly IEmployeeProfileChangeRepository _changeRepository;
        private readonly IOtpService _otpService;
        private readonly ILogger<EmployeeProfileService> _logger;
        private const int OTP_EXPIRY_SECONDS = 300; // 5 minutes

        public EmployeeProfileService(
            IEmployeeProfileRepository employeeRepository,
            IEmployeeProfileChangeRepository changeRepository,
            IOtpService otpService,
            ILogger<EmployeeProfileService> logger,
            AppDbContext context,ICurrentUserService currentUserService)
            : base(context, currentUserService)
        {
            _employeeRepository = employeeRepository;
            _changeRepository = changeRepository;
            _otpService = otpService;
            _logger = logger;
        }

        public async Task<MyProfileResponseDto?> GetMyProfileAsync(int employeeId)
        {
            var employee = await _employeeRepository.GetEmployeeWithDetailsAsync(employeeId);
            if (employee == null)
            {
                return null;
            }

            // Check for pending sensitive update requests
            var pendingChanges = await _changeRepository.GetPendingChangesByEmployeeIdAsync(employeeId);
            var pendingSensitiveChange = pendingChanges
                .FirstOrDefault(c => c.FieldName == "TaxID" || c.FieldName == "BankAccountNumber");

            // Calculate leave balances
            var annualBalance = employee.LeaveBalances.FirstOrDefault(lb => lb.LeaveType?.Name == "Annual")?.BalanceDays ?? 0;
            var sickBalance = employee.LeaveBalances.FirstOrDefault(lb => lb.LeaveType?.Name == "Sick")?.BalanceDays ?? 0;
            var personalBalance = employee.LeaveBalances.FirstOrDefault(lb => lb.LeaveType?.Name == "Personal")?.BalanceDays ?? 0;

            return new MyProfileResponseDto
            {
                EmployeeId = employee.EmployeeID.ToString(),
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email,
                Phone = employee.Phone ?? "",
                Position = "Employee", // Default position as it's not in Employee model
                Department = employee.Department?.DepartmentName ?? "N/A",
                Manager = employee.Manager != null ? $"{employee.Manager.FirstName} {employee.Manager.LastName}" : "N/A",
                Location = employee.Address ?? "N/A",
                JoinDate = employee.HireDate,
                AvatarUrl = employee.AvatarUrl ?? "",
                LeaveBalance = new LeaveBalanceSummaryDto
                {
                    Annual = (int)annualBalance,
                    Sick = (int)sickBalance,
                    Personal = (int)personalBalance
                },
                BasicInfo = new BasicInfoDto
                {
                    PhoneNumber = employee.Phone ?? "",
                    Address = employee.Address ?? "",
                    PersonalEmail = employee.PersonalEmail ?? "",
                    EmergencyContact = new EmergencyContactDto
                    {
                        Name = employee.EmergencyContactName ?? "",
                        Phone = employee.EmergencyContactPhone ?? "",
                        Relation = employee.EmergencyContactRelation ?? ""
                    }
                },
                SensitiveInfo = new SensitiveInfoDto
                {
                    IsLocked = true,
                    IdNumber = MaskSensitiveData(employee.TaxID),
                    BankAccount = MaskSensitiveData(employee.BankAccountNumber),
                    PendingRequest = pendingSensitiveChange != null ? new PendingRequestDto
                    {
                        RequestId = pendingSensitiveChange.ChangeID,
                        Status = pendingSensitiveChange.Status,
                        CreatedAt = pendingSensitiveChange.RequestedDate
                    } : null
                }
            };
        }

        public async Task<UpdateResultDto> UpdateBasicInfoAsync(int employeeId, UpdateBasicInfoDto dto)
        {
            // Dùng _context trực tiếp để lấy Entity
            var employee = await _context.Employees.FindAsync(employeeId);

            if (employee == null)
            {
                return new UpdateResultDto { Success = false, Message = "Employee not found" };
            }

            // --- GIỮ NGUYÊN PHẦN VALIDATION ---
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) ||
                string.IsNullOrWhiteSpace(dto.Address) ||
                string.IsNullOrWhiteSpace(dto.EmergencyContact.Name))
            {
                return new UpdateResultDto { Success = false, Message = "Please fill in all required fields" };
            }

            if (!IsValidPhone(dto.PhoneNumber))
                return new UpdateResultDto { Success = false, Message = "Please enter valid phone number" };

            if (!string.IsNullOrWhiteSpace(dto.PersonalEmail) && !IsValidEmail(dto.PersonalEmail))
                return new UpdateResultDto { Success = false, Message = "Please enter valid email address" };

            // --- CẬP NHẬT DỮ LIỆU (SNAPSHOT) ---
            employee.Phone = dto.PhoneNumber;
            employee.Address = dto.Address;
            employee.PersonalEmail = dto.PersonalEmail;
            employee.EmergencyContactName = dto.EmergencyContact.Name;
            employee.EmergencyContactPhone = dto.EmergencyContact.Phone;
            employee.EmergencyContactRelation = dto.EmergencyContact.Relation;

            // [ĐÃ SỬA LẠI CHỖ NÀY] 
            // Truyền biến 'employee' (Entity) thay vì 'employeeId' (int)
            // Để BaseService có thể dùng ChangeTracker soi ra sự thay đổi
            await SaveChangesWithEventAsync(employee, "InfoUpdated");

            _logger.LogInformation($"Employee {employeeId} updated info with Event Sourcing at {DateTime.Now}");

            return new UpdateResultDto
            {
                Success = true,
                Message = "Profile updated successfully",
                UpdatedAt = DateTime.Now
            };
        }

        public async Task<SensitiveRequestResponseDto> CreateSensitiveUpdateRequestAsync(int employeeId, SensitiveUpdateRequestDto dto)
        {
            var employee = await _employeeRepository.FindByEmployeeIdAsync(employeeId);
            if (employee == null)
            {
                throw new InvalidOperationException("Employee not found");
            }

            if (string.IsNullOrWhiteSpace(dto.IdNumber) && string.IsNullOrWhiteSpace(dto.BankAccount))
            {
                throw new InvalidOperationException("At least one sensitive field must be provided");
            }

            // Xóa tất cả OTP cũ của employee trước khi gửi mới bằng SQL
            var deletedCount = await _changeRepository.DeleteAllOtpsByEmployeeIdAsync(employeeId);
            _logger.LogInformation($"Deleted {deletedCount} old OTP records for employee {employeeId}");

            // Generate OTP
            var otp = _otpService.GenerateOtp();
            var expiryTime = DateTime.Now.AddSeconds(OTP_EXPIRY_SECONDS);

            // Create change requests for sensitive fields
            var changeId = 0;

            if (!string.IsNullOrWhiteSpace(dto.IdNumber))
            {
                var taxIdChange = new EmployeeProfileChange
                {
                    EmployeeID = employeeId,
                    FieldName = "TaxID",
                    OldValue = employee.TaxID,
                    NewValue = dto.IdNumber,
                    Status = "PendingOTP", // Custom status to indicate waiting for OTP
                    RequestedDate = DateTime.Now
                };
                await _changeRepository.AddAsync(taxIdChange);
                await _changeRepository.SaveAsync();
                changeId = taxIdChange.ChangeID;
            }

            if (!string.IsNullOrWhiteSpace(dto.BankAccount))
            {
                var bankChange = new EmployeeProfileChange
                {
                    EmployeeID = employeeId,
                    FieldName = "BankAccountNumber",
                    OldValue = employee.BankAccountNumber,
                    NewValue = dto.BankAccount,
                    Status = "PendingOTP",
                    RequestedDate = DateTime.Now
                };
                await _changeRepository.AddAsync(bankChange);
                await _changeRepository.SaveAsync();
                if (changeId == 0) changeId = bankChange.ChangeID;
            }

            // Store OTP temporarily (in production, use cache like Redis)
            // For now, we'll store it in a special change record
            // Store expiry as Unix timestamp to avoid timezone parsing issues
            var expiryUnixTimestamp = new DateTimeOffset(expiryTime).ToUnixTimeSeconds();
            var otpRecord = new EmployeeProfileChange
            {
                EmployeeID = employeeId,
                FieldName = $"OTP_{changeId}",
                OldValue = otp,
                NewValue = expiryUnixTimestamp.ToString(),
                Status = "OTPGenerated",
                RequestedDate = DateTime.Now
            };
            await _changeRepository.AddAsync(otpRecord);
            await _changeRepository.SaveAsync();

            // Send OTP via email
            await _otpService.SendOtpAsync(employee.Email, otp);

            _logger.LogInformation($"Sensitive update request created for employee {employeeId}, RequestID: {changeId}");

            return new SensitiveRequestResponseDto
            {
                RequestId = changeId,
                Message = "OTP has been sent to your registered email",
                ExpiresInSeconds = OTP_EXPIRY_SECONDS
            };
        }

        public async Task<VerifyOtpResultDto> VerifyOtpAndSubmitAsync(int employeeId, VerifyOtpDto dto)
        {
            // Find the OTP record (search in ALL changes, not just Pending)
            var changes = await _changeRepository.GetAllChangesByEmployeeIdAsync(employeeId);
            var otpRecord = changes.FirstOrDefault(c => c.FieldName == $"OTP_{dto.RequestId}" && c.Status == "OTPGenerated");

            _logger.LogInformation($"[VerifyOtp] Looking for OTP_{dto.RequestId} for employee {employeeId}");

            if (otpRecord == null)
            {
                _logger.LogWarning($"[VerifyOtp] OTP record not found for RequestId {dto.RequestId}, Employee {employeeId}");
                return new VerifyOtpResultDto
                {
                    Success = false,
                    Status = "Error",
                    Message = "OTP not found or already used"
                };
            }

            var storedOtp = otpRecord.OldValue;
            // Parse Unix timestamp back to DateTime
            var expiryUnixTimestamp = long.Parse(otpRecord.NewValue!);
            var expiryTime = DateTimeOffset.FromUnixTimeSeconds(expiryUnixTimestamp).LocalDateTime;

            _logger.LogInformation($"[VerifyOtp] Found OTP record. Stored: {storedOtp}, Provided: {dto.OtpCode}, Expiry: {expiryTime}, Now: {DateTime.Now}");

            // Verify OTP
            if (!_otpService.VerifyOtp(storedOtp!, dto.OtpCode, expiryTime))
            {
                _logger.LogWarning($"[VerifyOtp] OTP verification failed for employee {employeeId}");
                return new VerifyOtpResultDto
                {
                    Success = false,
                    Status = "Error",
                    Message = "Invalid or expired OTP"
                };
            }

            // Update all related changes to Pending status (waiting for HR approval)
            var pendingChanges = changes.Where(c => c.Status == "PendingOTP").ToList();
            foreach (var change in pendingChanges)
            {
                change.Status = "Pending";
                await _changeRepository.UpdateAsync(change);
            }

            // Mark OTP as used
            otpRecord.Status = "Used";
            await _changeRepository.UpdateAsync(otpRecord);
            
            // Cleanup: Delete old expired OTP records (older than 10 minutes)
            var cutoffTime = DateTimeOffset.Now.AddMinutes(-10).ToUnixTimeSeconds();
            var expiredOtps = changes.Where(c => 
                c.FieldName != null && 
                c.FieldName.StartsWith("OTP_") && 
                c.Status == "OTPGenerated" &&
                !string.IsNullOrEmpty(c.NewValue) &&
                long.TryParse(c.NewValue, out var expiry) &&
                expiry < cutoffTime
            ).ToList();
            
            foreach (var expired in expiredOtps)
            {
                await _changeRepository.DeleteAsync(expired.ChangeID);
                _logger.LogInformation($"Deleted expired OTP record: {expired.FieldName}");
            }
            
            await _changeRepository.SaveAsync();

            _logger.LogInformation($"OTP verified for employee {employeeId}, sensitive changes submitted for HR approval");

            return new VerifyOtpResultDto
            {
                Success = true,
                Status = "Pending",
                Message = "Your profile update request has been submitted successfully and is pending HR approval"
            };
        }

        // Helper methods
        private string? MaskSensitiveData(string? data)
        {
            if (string.IsNullOrWhiteSpace(data))
            {
                return null;
            }

            if (data.Length <= 4)
            {
                return new string('*', data.Length);
            }

            return new string('*', data.Length - 4) + data.Substring(data.Length - 4);
        }

        private bool IsValidPhone(string phone)
        {
            // Basic phone validation - can be enhanced
            return !string.IsNullOrWhiteSpace(phone) && phone.Length >= 10;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
