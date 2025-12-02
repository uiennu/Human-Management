using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HRM.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // TODO: Replace with real user validation from database
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == request.Email);
            
            if (employee == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // TODO: Implement proper password hashing and verification
            if (request.Password != "123456") // Temporary - replace with password verification
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, employee.EmployeeID.ToString()), // Add EmployeeID as NameIdentifier
                new Claim(ClaimTypes.Name, employee.Email),
                new Claim(ClaimTypes.GivenName, employee.FirstName),
                new Claim(ClaimTypes.Surname, employee.LastName),
                new Claim(ClaimTypes.Role, "Employee"),
                new Claim("EmployeeID", employee.EmployeeID.ToString()) // Also add as custom claim for convenience
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("super_secret_key_1234567890_super_long_key!"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: "hrm.api",
                audience: "hrm.api",
                claims: claims,
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
                role = "Employee" 
            });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
