using System.Security.Cryptography;

namespace HRM.Api.Services
{
    public interface IOtpService
    {
        string GenerateOtp();
        Task<bool> SendOtpAsync(string email, string otp);
        bool VerifyOtp(string storedOtp, string providedOtp, DateTime expiryTime);
    }

    public class OtpService : IOtpService
    {
        private readonly ILogger<OtpService> _logger;
        private readonly IEmailService _emailService;
        private const int OTP_LENGTH = 6;
        private const int OTP_EXPIRY_MINUTES = 5;

        public OtpService(ILogger<OtpService> logger, IEmailService emailService)
        {
            _logger = logger;
            _emailService = emailService;
        }

        public string GenerateOtp()
        {
            var randomNumber = new byte[4];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
            }
            var otp = BitConverter.ToUInt32(randomNumber, 0) % 1000000;
            return otp.ToString("D6");
        }

        public async Task<bool> SendOtpAsync(string email, string otp)
        {
            try
            {
                // Log OTP for development/testing
                _logger.LogInformation($"[OtpService] Sending OTP to {email}: {otp}");

                // Send OTP via email
                var result = await _emailService.SendOtpEmailAsync(email, otp);

                if (result)
                {
                    _logger.LogInformation($"[OtpService] OTP successfully sent to {email}");
                }
                else
                {
                    _logger.LogWarning($"[OtpService] Failed to send OTP email to {email}");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[OtpService] Error sending OTP to {email}");
                return false;
            }
        }

        public bool VerifyOtp(string storedOtp, string providedOtp, DateTime expiryTime)
        {
            _logger.LogInformation($"[OtpService] Verifying OTP. Stored: {storedOtp}, Provided: {providedOtp}, Expiry: {expiryTime}, Now: {DateTime.Now}");

            if (string.IsNullOrEmpty(storedOtp) || string.IsNullOrEmpty(providedOtp))
            {
                _logger.LogWarning($"[OtpService] OTP is null or empty.");
                return false;
            }

            if (DateTime.Now > expiryTime)
            {
                _logger.LogWarning($"[OtpService] OTP expired. Expiry: {expiryTime}, Now: {DateTime.Now}");
                return false;
            }

            bool match = storedOtp == providedOtp;
            _logger.LogInformation($"[OtpService] OTP match: {match}");
            return match;
        }
    }
}
