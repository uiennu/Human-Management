using System.Security.Claims;

namespace HRM.Api.Services
{
    public interface ICurrentUserService
    {
        int GetCurrentEmployeeId();
        bool IsAuthenticated { get; }
    }

    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public bool IsAuthenticated => 
            _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

        public int GetCurrentEmployeeId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return 0;

            var employeeIdClaim = user.FindFirst(ClaimTypes.NameIdentifier) 
                               ?? user.FindFirst("EmployeeID");
            
            if (employeeIdClaim == null || !int.TryParse(employeeIdClaim.Value, out int employeeId))
            {
                return 0;
            }

            return employeeId;
        }
    }
}
