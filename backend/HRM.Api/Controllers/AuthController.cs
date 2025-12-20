using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HRM.Api.Data;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using HRM.Api.DTOs;
using HRM.Api.Services;
using HRM.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;

        public AuthController(AppDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

            /// <summary>
            /// Hash a password using BCrypt. For migration/testing only.
            /// </summary>
            /// <param name="request">Object with plain password</param>
            /// <returns>Hashed password</returns>
            [HttpPost("hash-password")]
            public IActionResult HashPassword([FromBody] HashPasswordRequest request)
            {
                if (string.IsNullOrWhiteSpace(request?.Password))
                    return BadRequest(new { error = "Password is required" });

                string hashed = BCrypt.Net.BCrypt.HashPassword(request.Password);
                return Ok(new { hashedPassword = hashed });
            }

            public class HashPasswordRequest
            {
                public string Password { get; set; }
            }

        /// <summary>
        /// Register a new employee account (HR/Admin only)
        /// POST: /api/auth/register
        /// </summary>
        [HttpPost("register")]
        [Authorize(Policy = "HROnly")]
        public async Task<IActionResult> RegisterEmployee([FromBody] RegisterEmployeeDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (success, message, response) = await _authService.RegisterEmployeeAsync(dto);

            if (!success)
            {
                return BadRequest(new { message });
            }

            return Created($"/api/employees/{response!.EmployeeId}", response);
        }

        /// <summary>
        /// Get registration history (all EmployeeCreated events) - Admin only
        /// GET: /api/auth/registration-history
        /// </summary>
        [HttpGet("registration-history")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetRegistrationHistory()
        {
            var events = await _context.EmployeeEvents
                .Where(e => e.EventType == "EmployeeCreated")
                .OrderByDescending(e => e.CreatedAt)
                .Select(e => new
                {
                    EventID = e.EventID,
                    EmployeeID = e.AggregateID,
                    EventType = e.EventType,
                    EventData = e.EventData,
                    SequenceNumber = e.SequenceNumber,
                    EventVersion = e.EventVersion,
                    CreatedBy = e.CreatedBy,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            return Ok(events);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Get employee by email
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == request.Email);
            
            if (employee == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password using BCrypt
            // For backward compatibility, accept "123456" OR verify hashed password
            bool isValidPassword = false;
            
            if (string.IsNullOrEmpty(employee.PasswordHash))
            {
                // If no hash stored, check against default password (temporary for migration)
                isValidPassword = request.Password == "123456";
            }
            else
            {
                // Verify hashed password
                try
                {
                    isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, employee.PasswordHash);
                }
                catch
                {
                    // If verification fails, try plain text comparison as fallback
                    isValidPassword = request.Password == employee.PasswordHash;
                }
            }

            if (!isValidPassword)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Get employee roles from database
            var employeeRoles = await _context.EmployeeRoles
                .Where(er => er.EmployeeID == employee.EmployeeID)
                .Join(_context.Roles, er => er.RoleID, r => r.RoleID, (er, r) => r.RoleName)
                .ToListAsync();

            // Default to "IT Employee" if no roles assigned
            if (!employeeRoles.Any())
            {
                employeeRoles.Add("IT Employee");
            }

            // Create claims list
            var claimsList = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, employee.EmployeeID.ToString()),
                new Claim(ClaimTypes.Name, employee.Email),
                new Claim(ClaimTypes.GivenName, employee.FirstName),
                new Claim(ClaimTypes.Surname, employee.LastName),
                new Claim("EmployeeID", employee.EmployeeID.ToString())
            };

            // Add all roles as separate claims
            foreach (var role in employeeRoles)
            {
                claimsList.Add(new Claim(ClaimTypes.Role, role));
            }

            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "super_secret_key_1234567890_super_long_key!";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: "hrm.api",
                audience: "hrm.api",
                claims: claimsList,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);
            return Ok(new 
            { 
                token = jwt, 
                employeeId = employee.EmployeeID,
                name = $"{employee.FirstName} {employee.LastName}",
                email = employee.Email,
                roles = employeeRoles // Return list of roles
            });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
