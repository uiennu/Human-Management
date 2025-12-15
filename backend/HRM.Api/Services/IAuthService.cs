namespace HRM.Api.Services
{
    public interface IAuthService
    {
        /// <summary>
        /// Register a new employee with event sourcing
        /// </summary>
        /// <param name="dto">Employee registration data</param>
        /// <returns>Tuple containing success status, message, and response data</returns>
        Task<(bool Success, string Message, HRM.Api.DTOs.RegisterEmployeeResponseDto? Response)> RegisterEmployeeAsync(HRM.Api.DTOs.RegisterEmployeeDto dto);
    }
}
