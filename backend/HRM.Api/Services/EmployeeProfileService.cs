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
        Task<string> UploadAvatarAsync(int employeeId, IFormFile file);
    }

    public class EmployeeProfileService : BaseService, IEmployeeProfileService
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
            AppDbContext context, ICurrentUserService currentUserService)
            : base(context, currentUserService)
        {
            _employeeRepository = employeeRepository;
            _changeRepository = changeRepository;
            _otpService = otpService;
            _logger = logger;
        }

        public async Task<string> UploadAvatarAsync(int employeeId, IFormFile file)
        {
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null) throw new InvalidOperationException("Employee not found");

            if (file == null || file.Length == 0)
                throw new ArgumentException("No file uploaded");

            // 1. Tạo đường dẫn lưu file
            // Tạo thư mục nếu chưa có: backend/HRM.Api/wwwroot/uploads/avatars
            var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            // 2. Tạo tên file độc nhất (tránh trùng tên)
            var uniqueFileName = $"{employeeId}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadFolder, uniqueFileName);

            // 3. Lưu file vào ổ cứng
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 4. Lưu đường dẫn vào Database (URL tương đối)
            // Frontend sẽ gọi kiểu: http://localhost:5000/uploads/avatars/tenfile.jpg
            var avatarUrl = $"/uploads/avatars/{uniqueFileName}";
            
            employee.AvatarUrl = avatarUrl;
            await _context.SaveChangesAsync();

            return avatarUrl;
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
                    EmergencyContacts = employee.EmergencyContacts.Select(c => new EmergencyContactDto
                    {
                        Name = c.Name,
                        Phone = c.Phone ?? "",
                        Relation = c.Relation ?? ""
                    }).ToList()
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
            // Load employee kèm danh sách liên hệ cũ
            var employee = await _context.Employees
                .Include(e => e.EmergencyContacts)
                .FirstOrDefaultAsync(e => e.EmployeeID == employeeId);

            if (employee == null) return new UpdateResultDto { Success = false, Message = "Employee not found" };

            // 1. Validate thông tin cơ bản
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || string.IsNullOrWhiteSpace(dto.Address))
            {
                return new UpdateResultDto { Success = false, Message = "Phone number and Address are required" };
            }

            // 2. Validate Emergency Contacts (BẮT BUỘC ÍT NHẤT 1)
            if (dto.EmergencyContacts == null || dto.EmergencyContacts.Count == 0)
            {
                return new UpdateResultDto { Success = false, Message = "At least one emergency contact is required" };
            }

            foreach (var contact in dto.EmergencyContacts)
            {
                if (string.IsNullOrWhiteSpace(contact.Name) ||
                    string.IsNullOrWhiteSpace(contact.Phone) ||
                    string.IsNullOrWhiteSpace(contact.Relation))
                {
                    return new UpdateResultDto { Success = false, Message = "All emergency contact fields (Name, Phone, Relation) are required" };
                }
            }

            // --- CẬP NHẬT DỮ LIỆU ---

            // Chỉ cập nhật các field thực sự thay đổi
            if (employee.Phone != dto.PhoneNumber)
                employee.Phone = dto.PhoneNumber;
            
            if (employee.Address != dto.Address)
                employee.Address = dto.Address;
            
            if (employee.PersonalEmail != dto.PersonalEmail)
                employee.PersonalEmail = dto.PersonalEmail;

            // Capture old Emergency Contacts for event
            var oldContacts = employee.EmergencyContacts.Select(c => new { Name = c.Name, Phone = c.Phone ?? "", Relation = c.Relation ?? "" }).ToList();

            // Update Emergency Contacts (Xóa danh sách cũ -> Thêm danh sách mới)
            _context.EmployeeEmergencyContacts.RemoveRange(employee.EmergencyContacts);

            foreach (var contact in dto.EmergencyContacts)
            {
                employee.EmergencyContacts.Add(new EmployeeEmergencyContact
                {
                    Name = contact.Name,
                    Phone = contact.Phone,
                    Relation = contact.Relation
                });
            }

            // Lưu với Event Sourcing: Tự động ghi event "ProfileUpdated" vào bảng EmployeeEvents
            await SaveChangesWithEventAsync(employee, "ProfileUpdated");

            // Thêm Emergency Contacts vào event nếu có thay đổi
            var newContacts = dto.EmergencyContacts.Select(c => new { Name = c.Name, Phone = c.Phone ?? "", Relation = c.Relation ?? "" }).ToList();
            var contactsChanged = JsonSerializer.Serialize(oldContacts) != JsonSerializer.Serialize(newContacts);
            
            if (contactsChanged)
            {
                var lastEvent = await _context.EmployeeEvents
                    .Where(e => e.AggregateID == employeeId)
                    .OrderByDescending(e => e.SequenceNumber)
                    .FirstOrDefaultAsync();
                
                int nextSequence = (lastEvent?.SequenceNumber ?? 0) + 1;
                var performedBy = _currentUserService.GetCurrentEmployeeId();

                var emergencyContactEvent = new EmployeeEvent
                {
                    AggregateID = employeeId,
                    EventType = "EmergencyContactsUpdated",
                    EventData = JsonSerializer.Serialize(new
                    {
                        Old = oldContacts,
                        New = newContacts,
                        UpdatedAt = DateTime.Now
                    }),
                    SequenceNumber = nextSequence,
                    EventVersion = 1,
                    CreatedBy = performedBy,
                    CreatedAt = DateTime.Now
                };

                _context.EmployeeEvents.Add(emergencyContactEvent);
                await _context.SaveChangesAsync();
            }

            return new UpdateResultDto { Success = true, Message = "Profile updated successfully", UpdatedAt = DateTime.Now };
        }
        public async Task<SensitiveRequestResponseDto> CreateSensitiveUpdateRequestAsync(int employeeId, SensitiveUpdateRequestDto dto)
        {
            var employee = await _employeeRepository.FindByEmployeeIdAsync(employeeId);
            if (employee == null) throw new InvalidOperationException("Employee not found");

            // Xóa OTP cũ để tránh rác
            await _changeRepository.DeleteAllOtpsByEmployeeIdAsync(employeeId);

            var otp = _otpService.GenerateOtp();
            var changeId = 0; // Biến này dùng để gom nhóm các thay đổi vào chung 1 mã OTP

            // Helper Function: Giúp tạo bản ghi thay đổi cho từng trường
            async Task AddChange(string field, string? oldVal, string? newVal)
            {
                // Nếu không nhập mới hoặc giá trị mới y hệt cũ -> Bỏ qua
                if (string.IsNullOrWhiteSpace(newVal)) return;
                if (oldVal == newVal) return;

                var change = new EmployeeProfileChange
                {
                    EmployeeID = employeeId,
                    FieldName = field,
                    OldValue = oldVal ?? "",
                    NewValue = newVal,
                    Status = "PendingOTP", // Trạng thái chờ OTP
                    RequestedDate = DateTime.Now
                };
                await _changeRepository.AddAsync(change);
                await _changeRepository.SaveAsync();

                // Lấy ID của thay đổi đầu tiên làm "RequestId" đại diện cho đợt này
                if (changeId == 0) changeId = change.ChangeID;
            }

            // 2. XỬ LÝ CÁC TRƯỜNG (Dùng hàm helper ở trên)

            // Tax ID
            await AddChange("TaxID", employee.TaxID, dto.IdNumber);

            // Bank Account
            await AddChange("BankAccountNumber", employee.BankAccountNumber, dto.BankAccount);

            // FirstName (Tên)
            await AddChange("FirstName", employee.FirstName, dto.FirstName);

            // LastName (Họ)
            await AddChange("LastName", employee.LastName, dto.LastName);

            // Nếu không có thay đổi nào hợp lệ được tạo ra (do user nhập giống cũ hoặc để trống hết)
            if (changeId == 0)
            {
                return new SensitiveRequestResponseDto { Message = "No changes detected needing approval." };
            }

            // 3. TẠO BẢN GHI OTP
            var expiryTime = DateTime.Now.AddSeconds(OTP_EXPIRY_SECONDS); // Dùng constant đã khai báo đầu class
            var otpRecord = new EmployeeProfileChange
            {
                EmployeeID = employeeId,
                FieldName = $"OTP_{changeId}", // Gắn OTP với changeId đầu tiên
                OldValue = otp,
                NewValue = new DateTimeOffset(expiryTime).ToUnixTimeSeconds().ToString(), // Lưu timestamp hết hạn
                Status = "OTPGenerated",
                RequestedDate = DateTime.Now
            };
            await _changeRepository.AddAsync(otpRecord);
            await _changeRepository.SaveAsync();

            // 4. GỬI MAIL OTP
            await _otpService.SendOtpAsync(employee.Email, otp);

            return new SensitiveRequestResponseDto
            {
                RequestId = changeId,
                Message = "OTP sent to your email",
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

            // Thêm Event Sourcing cho Sensitive Information changes
            if (pendingChanges.Count > 0)
            {
                var lastEvent = await _context.EmployeeEvents
                    .Where(e => e.AggregateID == employeeId)
                    .OrderByDescending(e => e.SequenceNumber)
                    .FirstOrDefaultAsync();
                
                int nextSequence = (lastEvent?.SequenceNumber ?? 0) + 1;

                var sensitiveChanges = new Dictionary<string, object>();
                foreach (var change in pendingChanges)
                {
                    sensitiveChanges[change.FieldName] = new
                    {
                        Old = change.OldValue,
                        New = change.NewValue
                    };
                }

                var sensitiveEvent = new EmployeeEvent
                {
                    AggregateID = employeeId,
                    EventType = "SensitiveInfoUpdateRequested",
                    EventData = JsonSerializer.Serialize(new
                    {
                        Changes = sensitiveChanges,
                        RequestedAt = DateTime.Now,
                        Status = "Pending"
                    }),
                    SequenceNumber = nextSequence,
                    EventVersion = 1,
                    CreatedBy = employeeId,
                    CreatedAt = DateTime.Now
                };

                _context.EmployeeEvents.Add(sensitiveEvent);
                await _context.SaveChangesAsync();
            }

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
