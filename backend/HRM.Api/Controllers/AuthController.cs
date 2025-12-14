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
        private readonly IPasswordGenerator _passwordGenerator;

        public AuthController(AppDbContext context, IPasswordGenerator passwordGenerator)
        {
            _context = context;
            _passwordGenerator = passwordGenerator;
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

            // Check if email already exists
            var existingEmployee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Email == dto.Email);
            
            if (existingEmployee != null)
            {
                return BadRequest(new { message = "Email already exists" });
            }

            // Validate department exists (if provided)
            if (dto.DepartmentID.HasValue)
            {
                var departmentExists = await _context.Departments
                    .AnyAsync(d => d.DepartmentID == dto.DepartmentID.Value);
                
                if (!departmentExists)
                {
                    return BadRequest(new { message = "Department not found" });
                }
            }

            // Validate manager exists (if provided)
            if (dto.ManagerID.HasValue)
            {
                var managerExists = await _context.Employees
                    .AnyAsync(e => e.EmployeeID == dto.ManagerID.Value);
                
                if (!managerExists)
                {
                    return BadRequest(new { message = "Manager not found" });
                }
            }

            // Validate role exists
            var roleExists = await _context.Roles
                .AnyAsync(r => r.RoleID == dto.RoleID);
            
            if (!roleExists)
            {
                return BadRequest(new { message = "Role not found" });
            }

            // Validate hire date is not in the future
            if (dto.HireDate > DateTime.Now.Date)
            {
                return BadRequest(new { message = "Hire date cannot be in the future" });
            }

            try
            {
                // Generate temporary password
                var tempPassword = _passwordGenerator.GenerateTemporaryPassword();

                // Hash the password
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(tempPassword);

                // Create employee
                var employee = new Employee
                {
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Email = dto.Email,
                    PasswordHash = hashedPassword,
                    Phone = dto.Phone,
                    Address = dto.Address,
                    HireDate = dto.HireDate,
                    DepartmentID = dto.DepartmentID,
                    ManagerID = dto.ManagerID,
                    PersonalEmail = dto.PersonalEmail,
                    IsActive = true,
                    CurrentPoints = 0
                };

                // Add to database
                await _context.Employees.AddAsync(employee);
                await _context.SaveChangesAsync();

                // Assign role
                var employeeRole = new EmployeeRole
                {
                    EmployeeID = employee.EmployeeID,
                    RoleID = dto.RoleID
                };
                await _context.EmployeeRoles.AddAsync(employeeRole);
                await _context.SaveChangesAsync();

                // Return response
                var response = new RegisterEmployeeResponseDto
                {
                    EmployeeId = employee.EmployeeID,
                    Email = employee.Email,
                    TempPassword = tempPassword,
                    Message = "Employee registered successfully. Please share the temporary password securely with the employee."
                };

                return Created($"/api/employees/{employee.EmployeeID}", response);
            }
            catch (Exception ex)
            {
                // Log the error (in production, use proper logging)
                Console.WriteLine($"Error registering employee: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while registering the employee" });
            }
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
