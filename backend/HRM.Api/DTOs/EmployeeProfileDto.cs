namespace HRM.Api.DTOs
{
    // Emergency Contact DTO
    public class EmergencyContactDto
    {
        public string Name { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Relation { get; set; } = "";
    }

    // Basic Info DTO
    public class BasicInfoDto
    {
        public string PhoneNumber { get; set; } = "";
        public string Address { get; set; } = "";
        public string PersonalEmail { get; set; } = "";
        public EmergencyContactDto EmergencyContact { get; set; } = new();
    }

    // Pending Request DTO
    public class PendingRequestDto
    {
        public int RequestId { get; set; }
        public string Status { get; set; } = "";
        public DateTime CreatedAt { get; set; }
    }

    // Sensitive Info DTO
    public class SensitiveInfoDto
    {
        public bool IsLocked { get; set; } = true;
        public string? IdNumber { get; set; }
        public string? BankAccount { get; set; }
        public PendingRequestDto? PendingRequest { get; set; }
    }

    // My Profile Response DTO
    public class MyProfileResponseDto
    {
        public string EmployeeId { get; set; } = "";
        public string FullName { get; set; } = "";
        public string AvatarUrl { get; set; } = "";
        public BasicInfoDto BasicInfo { get; set; } = new();
        public SensitiveInfoDto SensitiveInfo { get; set; } = new();
    }

    // Update Basic Info DTO
    public class UpdateBasicInfoDto
    {
        public string PhoneNumber { get; set; } = "";
        public string Address { get; set; } = "";
        public string PersonalEmail { get; set; } = "";
        public EmergencyContactDto EmergencyContact { get; set; } = new();
    }

    // Sensitive Update Request DTO
    public class SensitiveUpdateRequestDto
    {
        public string? IdNumber { get; set; }
        public string? BankAccount { get; set; }
    }

    // Sensitive Request Response DTO
    public class SensitiveRequestResponseDto
    {
        public int RequestId { get; set; }
        public string Message { get; set; } = "";
        public int ExpiresInSeconds { get; set; }
    }

    // Verify OTP DTO
    public class VerifyOtpDto
    {
        public int RequestId { get; set; }
        public string OtpCode { get; set; } = "";
    }

    // Verify OTP Result DTO
    public class VerifyOtpResultDto
    {
        public bool Success { get; set; }
        public string Status { get; set; } = "";
        public string Message { get; set; } = "";
    }

    // Update Result DTO
    public class UpdateResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public DateTime? UpdatedAt { get; set; }
    }
}
