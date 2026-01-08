using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;
using System.Linq;
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HRM.Api.Services
{
    public class TeamService : ITeamService
    {
        private readonly ITeamRepository _teamRepository;
        private readonly IOrganizationRepository _organizationRepository;

        public TeamService(ITeamRepository teamRepository, IOrganizationRepository organizationRepository)
        {
            _teamRepository = teamRepository;
            _organizationRepository = organizationRepository;
        }

        private async Task LogActionAsync(string eventType, string entity, int targetId, object data, int userId)
        {
            var logEntry = new OrganizationLogDto
            {
                EventType = eventType,
                TargetEntity = entity,
                TargetID = targetId,
                EventData = data != null ? JsonSerializer.Serialize(data) : "{}",
                PerformedBy = userId,
                PerformedAt = DateTime.Now
            };
            await _organizationRepository.AddLogAsync(logEntry);
        }

        public async Task<(bool Success, string Message, int? EmployeeId)> AddEmployeeToTeamAsync(int teamId, int employeeId, int userId)
        {
            try
            {
                // Validate team exists
                var team = await _teamRepository.GetTeamByIdAsync(teamId);
                if (team == null)
                {
                    return (false, "Team not found", null);
                }

                // Validate employee exists
                var employee = await _teamRepository.GetEmployeeByIdAsync(employeeId);
                if (employee == null)
                {
                    return (false, "Employee not found", null);
                }

                // Check if employee is active
                if (!employee.IsActive)
                {
                    return (false, "Employee is locked or inactive and cannot be assigned to a team", null);
                }

                // Check existing memberships for this employee
                var memberships = await _teamRepository.GetTeamMembersByEmployeeAsync(employeeId);

                // If already a member of this exact team, reject
                if (memberships.Any(m => m.SubTeamID == teamId))
                {
                    return (false, "Employee is already a member of this team", null);
                }

                // If employee has memberships in other departments, reject
                if (memberships.Any(m => m.SubTeam != null && m.SubTeam.DepartmentID != team.DepartmentID))
                {
                    return (false, "Employee is already assigned to a team in a different department", null);
                }

                // Add employee to team
                var teamMember = new SubTeamMember
                {
                    SubTeamID = teamId,
                    EmployeeID = employeeId
                };

                await _teamRepository.AddTeamMemberAsync(teamMember);

                // Log the action
                var employeeName = $"{employee.FirstName} {employee.LastName}";
                await _organizationRepository.AddLogAsync(new OrganizationLogDto
                {
                    EventType = "AddEmployeeToTeam",
                    TargetEntity = "Employee",
                    TargetID = employeeId,
                    EventData = JsonSerializer.Serialize(new
                    {
                        EmployeeID = employeeId,
                        EmployeeName = employeeName,
                        SubTeamID = teamId,
                        SubTeamName = team.TeamName,
                        DepartmentID = team.DepartmentID,
                        OldSubTeamID = (int?)null,
                        NewSubTeamID = teamId,
                        Description = $"Added {employeeName} to team {team.TeamName}"
                    }),
                    PerformedBy = userId,
                    PerformedAt = DateTime.Now
                });

                return (true, "Employee added to team successfully", employeeId);
            }
            catch (Exception ex)
            {
                // Log the exception if you have logging configured
                Console.WriteLine($"Error adding employee to team: {ex.Message}");
                return (false, "An error occurred while adding employee to team", null);
            }
        }

        public async Task<(bool Success, string Message, RemoveEmployeeDataDto? Data)> RemoveEmployeeFromTeamAsync(int teamId, int employeeId, int userId)
        {
            try
            {
                // Validate team exists
                var team = await _teamRepository.GetTeamByIdAsync(teamId);
                if (team == null)
                {
                    return (false, "Team not found", null);
                }

                // Validate employee exists
                var employee = await _teamRepository.GetEmployeeByIdAsync(employeeId);
                if (employee == null)
                {
                    return (false, "Employee not found", null);
                }

                // Get employee's team membership
                var teamMember = await _teamRepository.GetTeamMemberAsync(employeeId);
                
                // Check if employee is in any team
                if (teamMember == null)
                {
                    return (false, "Employee is not assigned to any team", null);
                }

                // Check if employee is in THIS specific team
                if (teamMember.SubTeamID != teamId)
                {
                    return (false, "Employee is not a member of this team", null);
                }

                // Check if employee is locked (inactive)
                if (!employee.IsActive)
                {
                    return (false, "Employee is locked and cannot be removed from team", null);
                }

                // Remove employee from team
                await _teamRepository.RemoveTeamMemberAsync(teamMember);

                // Log the action to OrganizationStructureLogs
                var employeeName = $"{employee.FirstName} {employee.LastName}";
                var teamName = team.TeamName;
                await _teamRepository.LogRemoveEmployeeActionAsync(
                    employeeId, 
                    teamId, 
                    team.DepartmentID, 
                    employeeName, 
                    teamName, 
                    userId
                );

                var data = new RemoveEmployeeDataDto
                {
                    EmployeeId = employeeId,
                    TeamId = teamId
                };

                return (true, "Employee removed from team successfully", data);
            }
            catch (Exception ex)
            {
                // Log the exception if you have logging configured
                Console.WriteLine($"Error removing employee from team: {ex.Message}");
                return (false, "An error occurred while removing employee from team", null);
            }
        }

        public async Task<List<TeamResponseDto>> GetAllTeamsAsync()
        {
            try
            {
                var teams = await _teamRepository.GetAllTeamsAsync();

                return teams.Select(team => new TeamResponseDto
                {
                    SubTeamID = team.SubTeamID,
                    TeamName = team.TeamName,
                    Description = team.Description,
                    DepartmentID = team.DepartmentID,
                    DepartmentName = team.Department?.DepartmentName,
                    TeamLeadID = team.TeamLeadID,
                    TeamLeadName = team.TeamLead != null 
                        ? $"{team.TeamLead.FirstName} {team.TeamLead.LastName}" 
                        : null,
                    MemberCount = team.SubTeamMembers?.Count ?? 0,
                    Members = team.SubTeamMembers?.Select(m => new TeamMemberDto
                    {
                        EmployeeID = m.EmployeeID,
                        FirstName = m.Employee?.FirstName ?? "",
                        LastName = m.Employee?.LastName ?? "",
                        Email = m.Employee?.Email ?? "",
                        Phone = m.Employee?.Phone,
                        DepartmentID = m.Employee?.DepartmentID,
                        DepartmentName = m.Employee?.Department?.DepartmentName
                    }).ToList() ?? new List<TeamMemberDto>()
                }).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting teams: {ex.Message}");
                return new List<TeamResponseDto>();
            }
        }

        public async Task<List<int>> GetUnassignedEmployeesAsync()
        {
            try
            {
                var unassignedEmployees = await _teamRepository.GetUnassignedEmployeesAsync();
                return unassignedEmployees.Select(e => e.EmployeeID).ToList();
            }
            catch (Exception ex)
            {
                // Log the exception if you have logging configured
                Console.WriteLine($"Error getting unassigned employees: {ex.Message}");
                return new List<int>();
            }
        }

        public async Task<List<RoleDto>> GetAllRolesAsync()
        {
            var roles = await _teamRepository.GetAllRolesAsync();
            return roles.Select(r => new RoleDto
            {
                RoleID = r.RoleID,
                RoleName = r.RoleName
            }).ToList();
        }

        public async Task<List<DepartmentDto>> GetAllDepartmentsAsync()
        {
            var depts = await _teamRepository.GetAllDepartmentsAsync();
            return depts.Select(d => new DepartmentDto
            {
                DepartmentID = d.DepartmentID,
                DepartmentName = d.DepartmentName,
                DepartmentCode = d.DepartmentCode
            }).ToList();
        }

        public async Task<List<ManagerDto>> GetManagersAsync()
        {
            var managers = await _teamRepository.GetManagersAsync();
            return managers.Select(m => new ManagerDto
            {
                EmployeeID = m.EmployeeID,
                FirstName = m.FirstName,
                LastName = m.LastName,
                Email = m.Email,
                DepartmentID = m.DepartmentID
            }).ToList();
        }

        public async Task<List<EmployeeListDto>> GetAllEmployeesAsync()
        {
            var employees = await _teamRepository.GetAllEmployeesAsync();
            return employees.Select(e => new EmployeeListDto
            {
                EmployeeID = e.EmployeeID,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Phone = e.Phone ?? "",
                DepartmentName = e.Department?.DepartmentName,
                Position = e.EmployeeRoles.FirstOrDefault()?.Role?.RoleName,
                HireDate = e.HireDate,
                IsActive = e.IsActive
            }).ToList();
        }
        // --- HÀM TẠO TEAM (ĐÃ SỬA: Thêm tham số int userId) ---
        public async Task<(bool Success, string Message, int? TeamId)> CreateTeamAsync(int departmentId, CreateSubTeamDto dto, int userId)
        {
            // 1. Kiểm tra Department có tồn tại không
            var departments = await _teamRepository.GetAllDepartmentsAsync();
            var department = departments.FirstOrDefault(d => d.DepartmentID == departmentId);
            if (department == null)
            {
                return (false, "Department not found", null);
            }

            // 2. Validate Team Lead (nếu có chọn)
            if (dto.TeamLeadId.HasValue)
            {
                var employee = await _teamRepository.GetEmployeeByIdAsync(dto.TeamLeadId.Value);
                if (employee == null)
                {
                    return (false, "Team Lead employee not found", null);
                }
                
                // Logic: Team Lead phải thuộc cùng Department
                if (employee.DepartmentID != departmentId)
                {
                    return (false, "Team Lead must belong to the same department", null);
                }
            }

            // 3. Tạo SubTeam (Team)
            var subTeam = new SubTeam
            {
                TeamName = dto.TeamName,
                Description = dto.Description,
                DepartmentID = departmentId,
                TeamLeadID = dto.TeamLeadId
            };

            var createdTeam = await _teamRepository.AddSubTeamAsync(subTeam);

            // 4. Tự động thêm Team Lead vào thành viên của Team
            if (dto.TeamLeadId.HasValue)
            {
                try
                {
                    var teamLeadMember = new SubTeamMember
                    {
                        SubTeamID = createdTeam.SubTeamID,
                        EmployeeID = dto.TeamLeadId.Value
                    };
                    await _teamRepository.AddTeamMemberAsync(teamLeadMember);
                }
                catch (Exception ex)
                {
                    // Log lỗi nhẹ (warning) nhưng không làm fail quy trình tạo team
                    Console.WriteLine($"Warning: Could not add team lead to members: {ex.Message}");
                }
            }

            // --- 5. GHI LOG SỬ DỤNG HÀM CHUẨN EVENT SOURCING ---
            await LogActionAsync("CreateSubTeam", "SubTeam", createdTeam.SubTeamID, new 
            {
                Name = createdTeam.TeamName,
                DeptID = departmentId,
                LeadID = dto.TeamLeadId
            }, userId);

            return (true, "Team created successfully", createdTeam.SubTeamID);
        }

        public async Task<(bool Success, string Message)> UpdateTeamAsync(int teamId, UpdateSubTeamDto dto, int userId)
        {
            try
            {
                var team = await _teamRepository.GetTeamByIdAsync(teamId);
                if (team == null) return (false, "Team not found");

                int? oldLead = team.TeamLeadID;
                var oldTeamName = team.TeamName;
                var oldDescription = team.Description;

                // Validate new team lead if provided
                if (dto.TeamLeadId.HasValue)
                {
                    var emp = await _teamRepository.GetEmployeeByIdAsync(dto.TeamLeadId.Value);
                    if (emp == null) return (false, "Team lead employee not found");
                    if (!emp.IsActive) return (false, "Team lead is inactive");
                    if (emp.DepartmentID != team.DepartmentID) return (false, "Team lead must belong to the same department");
                }

                // Apply updates
                team.TeamName = dto.TeamName;
                team.Description = dto.Description;
                team.TeamLeadID = dto.TeamLeadId;

                await _teamRepository.UpdateSubTeamAsync(team);

                // If team lead changed, ensure new lead is a member
                if (dto.TeamLeadId.HasValue && dto.TeamLeadId != oldLead)
                {
                    var membership = await _teamRepository.GetTeamMemberAsync(dto.TeamLeadId.Value);
                    if (membership == null || membership.SubTeamID != teamId)
                    {
                        try
                        {
                            await _teamRepository.AddTeamMemberAsync(new SubTeamMember { SubTeamID = teamId, EmployeeID = dto.TeamLeadId.Value });
                        }
                        catch { /* ignore add failure */ }
                    }
                }

                // Log update
                try
                {
                    await _teamRepository.LogTeamUpdateAsync(
                        teamId: team.SubTeamID,
                        oldTeamName: oldTeamName,
                        newTeamName: dto.TeamName,
                        oldDescription: oldDescription ?? "",
                        newDescription: dto.Description ?? "",
                        oldTeamLeadId: oldLead,
                        newTeamLeadId: dto.TeamLeadId,
                        performedBy: userId
                    );
                }
                catch { }

                return (true, "Team updated successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating team: {ex.Message}");
                return (false, "An error occurred while updating team");
            }
        }

        public async Task<(bool Success, string Message)> MoveEmployeeAsync(int employeeId, int targetTeamId, int userId) // <--- 1. Đã thêm tham số userId
        {
            try
            {
                // Validate employee exists
                var employee = await _teamRepository.GetEmployeeByIdAsync(employeeId);
                if (employee == null) return (false, "Employee not found");
                if (!employee.IsActive) return (false, "Employee is locked or inactive and cannot be moved");

                // Delegate atomic move to repository which ensures transaction and logging
                
                // --- ĐOẠN NÀY ĐÃ SỬA ---
                // Không dùng hardcode "performedBy = 1" nữa
                // Truyền thẳng userId từ Controller xuống Repository
                var result = await _teamRepository.MoveEmployeeAsync(employeeId, targetTeamId, userId);
                
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error moving employee in service: {ex.Message}");
                return (false, "An error occurred while moving employee");
            }
        }
    }
}
