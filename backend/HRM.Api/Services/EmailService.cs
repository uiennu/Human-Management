using Resend;

namespace HRM.Api.Services
{
    public interface IEmailService
    {
        Task<bool> SendOtpEmailAsync(string toEmail, string otpCode);
    }

    public class ResendEmailService : IEmailService
    {
        private readonly IResend _resendClient;
        private readonly ILogger<ResendEmailService> _logger;
        private readonly string _fromEmail;

        public ResendEmailService(IResend resendClient, IConfiguration configuration, ILogger<ResendEmailService> logger)
        {
            _resendClient = resendClient;
            _logger = logger;
            _fromEmail = Environment.GetEnvironmentVariable("RESEND_FROM_EMAIL") 
                ?? configuration["Resend:FromEmail"] 
                ?? "HRM OTP <onboarding@resend.dev>";
        }

        public async Task<bool> SendOtpEmailAsync(string toEmail, string otpCode)
        {
            try
            {
                var message = new EmailMessage();
                message.From = _fromEmail;
                message.To = new EmailAddressList { toEmail };
                message.Subject = "Your OTP Code - HRM System";
                message.HtmlBody = $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px;'>
                        <h2>OTP Verification Code</h2>
                        <p>Your OTP code for updating sensitive information is:</p>
                        <h1 style='color: #13a4ec; letter-spacing: 5px;'>{otpCode}</h1>
                        <p>This code will expire in 5 minutes.</p>
                        <p>If you did not request this code, please ignore this email.</p>
                        <hr />
                        <p style='color: #666; font-size: 12px;'>HRM System - Human Resource Management</p>
                    </div>
                ";

                var response = await _resendClient.EmailSendAsync(message);
                _logger.LogInformation($"OTP email sent successfully to {toEmail}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send OTP email to {toEmail}");
                return false;
            }
        }
    }
}
