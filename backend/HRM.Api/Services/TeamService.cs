using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;

namespace HRM.Api.Services
{
    public class TeamService : ITeamService
    {
        private readonly ITeamRepository _teamRepository;

        public TeamService(ITeamRepository teamRepository)
        {
            _teamRepository = teamRepository;
        }

        public async Task<(bool Success, string Message, int? EmployeeId)> AddEmployeeToTeamAsync(int teamId, int employeeId)
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

                // Check if employee is already in a team
                var existingMembership = await _teamRepository.GetTeamMemberAsync(employeeId);
                if (existingMembership != null)
                {
                    return (false, "Employee is already assigned to a team", null);
                }

                // Add employee to team
                var teamMember = new SubTeamMember
                {
                    SubTeamID = teamId,
                    EmployeeID = employeeId
                };

                await _teamRepository.AddTeamMemberAsync(teamMember);

                return (true, "Employee added to team successfully", employeeId);
            }
            catch (Exception ex)
            {
                // Log the exception if you have logging configured
                Console.WriteLine($"Error adding employee to team: {ex.Message}");
                return (false, "An error occurred while adding employee to team", null);
            }
        }

        public async Task<(bool Success, string Message, RemoveEmployeeDataDto? Data)> RemoveEmployeeFromTeamAsync(int teamId, int employeeId)
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
                    employeeId // TODO: Replace with current logged-in user ID from HttpContext
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
        public async Task<(bool Success, string Message, int? TeamId)> CreateTeamAsync(int departmentId, CreateSubTeamDto dto)
        {
            // 1. Verify Department exists
            var departments = await _teamRepository.GetAllDepartmentsAsync();
            var department = departments.FirstOrDefault(d => d.DepartmentID == departmentId);
            if (department == null)
            {
                return (false, "Department not found", null);
            }

            // 2. Validate Team Lead (if provided)
            if (dto.TeamLeadId.HasValue)
            {
                var employee = await _teamRepository.GetEmployeeByIdAsync(dto.TeamLeadId.Value);
                if (employee == null)
                {
                    return (false, "Team Lead employee not found", null);
                }
                
                // Optional: Check if employee belongs to the same department?
                // For now, let's just ensure they exist. Business logic might vary.
                if (employee.DepartmentID != departmentId)
                {
                    return (false, "Team Lead must belong to the same department", null);
                }
            }

            // 3. Create SubTeam
            var subTeam = new SubTeam
            {
                TeamName = dto.TeamName,
                Description = dto.Description,
                DepartmentID = departmentId,
                TeamLeadID = dto.TeamLeadId
            };

            var createdTeam = await _teamRepository.AddSubTeamAsync(subTeam);

            // 4. Automatically add Team Lead to SubTeamMembers (if provided)
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
                    // Log but don't fail team creation if team lead is already in another team
                    Console.WriteLine($"Warning: Could not add team lead to members: {ex.Message}");
                    // Team creation still succeeds
                }
            }

            return (true, "Team created successfully", createdTeam.SubTeamID);
        }
    }
}
