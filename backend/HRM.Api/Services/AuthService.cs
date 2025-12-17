using HRM.Api.Data;
using HRM.Api.DTOs;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HRM.Api.Services
{
    public class AuthService : BaseService, IAuthService
    {
        private readonly IPasswordGenerator _passwordGenerator;

        public AuthService(
            AppDbContext context, 
            ICurrentUserService currentUserService,
            IPasswordGenerator passwordGenerator) 
            : base(context, currentUserService)
        {
            _passwordGenerator = passwordGenerator;
        }

        public async Task<(bool Success, string Message, RegisterEmployeeResponseDto? Response)> RegisterEmployeeAsync(RegisterEmployeeDto dto)
        {
            try
            {
                // DEDUPLICATION: Check event store first to prevent duplicate registrations
                // This prevents duplicates from double-clicks, network retries, etc.
                var existingCreatedEvent = await _context.EmployeeEvents
                    .Where(e => e.EventType == "EmployeeCreated")
                    .ToListAsync();

                // Check if any EmployeeCreated event has this email in its EventData
                foreach (var evt in existingCreatedEvent)
                {
                    try
                    {
                        var eventData = JsonSerializer.Deserialize<Employee>(evt.EventData);
                        if (eventData != null && eventData.Email.Equals(dto.Email, StringComparison.OrdinalIgnoreCase))
                        {
                            // Found existing EmployeeCreated event for this email - prevent duplicate
                            return (false, "Email already exists", null);
                        }
                    }
                    catch
                    {
                        // Skip events that can't be deserialized
                        continue;
                    }
                }

                // Fallback: Also check database directly (in case event store is out of sync)
                var existingEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Email == dto.Email);
                
                if (existingEmployee != null)
                {
                    return (false, "Email already exists", null);
                }

                // Validate department exists (if provided)
                if (dto.DepartmentID.HasValue)
                {
                    var departmentExists = await _context.Departments
                        .AnyAsync(d => d.DepartmentID == dto.DepartmentID.Value);
                    
                    if (!departmentExists)
                    {
                        return (false, "Department not found", null);
                    }
                }

                // Validate manager exists (if provided)
                if (dto.ManagerID.HasValue)
                {
                    var managerExists = await _context.Employees
                        .AnyAsync(e => e.EmployeeID == dto.ManagerID.Value);
                    
                    if (!managerExists)
                    {
                        return (false, "Manager not found", null);
                    }
                }

                // Validate role exists
                var roleExists = await _context.Roles
                    .AnyAsync(r => r.RoleID == dto.RoleID);
                
                if (!roleExists)
                {
                    return (false, "Role not found", null);
                }

                // Validate hire date is not in the future
                if (dto.HireDate > DateTime.Now.Date)
                {
                    return (false, "Hire date cannot be in the future", null);
                }

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

                // Add to database and track with event sourcing
                await _context.Employees.AddAsync(employee);
                
                // This will save the employee AND create an "EmployeeCreated" event
                await SaveChangesWithEventAsync(employee, "EmployeeCreated");

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

                return (true, "Employee registered successfully", response);
            }
            catch (DbUpdateException dbEx)
            {
                // Handle database constraint violations (including duplicate key)
                var errorMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                
                // Check for duplicate email constraint violation
                if (errorMessage.Contains("Duplicate entry") && errorMessage.Contains("Email") ||
                    errorMessage.Contains("UNIQUE constraint") && errorMessage.Contains("Email"))
                {
                    return (false, "Email already exists", null);
                }
                
                // Log the error (in production, use proper logging)
                Console.WriteLine($"Database error registering employee: {errorMessage}");
                return (false, "An error occurred while registering the employee. Please try again.", null);
            }
            catch (Exception ex)
            {
                // Log the error (in production, use proper logging)
                Console.WriteLine($"Error registering employee: {ex.Message}");
                return (false, "An error occurred while registering the employee", null);
            }
        }
    }
}
