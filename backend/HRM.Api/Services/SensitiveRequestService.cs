using HRM.Api.Data;
using HRM.Api.DTOs;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace HRM.Api.Services
{
    public class SensitiveRequestService : ISensitiveRequestService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SensitiveRequestService> _logger;
        private readonly ISensitiveRequestAuthorizationService _authService;

        public SensitiveRequestService(
            AppDbContext context, 
            ILogger<SensitiveRequestService> logger,
            ISensitiveRequestAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        public async Task<SensitiveRequestListResponseDto> GetAllSensitiveRequestsAsync(
            int currentUserId,
            string? status = null,
            int page = 1,
            int pageSize = 10,
            string? searchTerm = null)
        {
            // Get all non-OTP records (actual field changes)
            var query = _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.Approver)
                .Where(c => !c.FieldName.StartsWith("OTP_")) // Exclude OTP records
                .Where(c => c.Status != "PendingOTP" && c.Status != "OTPGenerated") // Exclude OTP-related statuses
                .AsQueryable();

            // Filter by status if provided
            if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
            {
                query = query.Where(c => c.Status == status);
            }

            // Search by employee name or employee ID
            if (!string.IsNullOrEmpty(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(c =>
                    (c.Employee!.FirstName + " " + c.Employee.LastName).ToLower().Contains(term) ||
                    c.Employee.EmployeeID.ToString().Contains(term));
            }

            // Get all changes for grouping
            var groupedData = await query
                .OrderByDescending(c => c.RequestedDate)
                .ToListAsync();

            // Group by EmployeeID and same request date (within 1 minute)
            var grouped = groupedData
                .GroupBy(c => new
                {
                    c.EmployeeID,
                    RequestTime = new DateTime(
                        c.RequestedDate.Year,
                        c.RequestedDate.Month,
                        c.RequestedDate.Day,
                        c.RequestedDate.Hour,
                        c.RequestedDate.Minute,
                        0)
                })
                .Select(g => new GroupedSensitiveRequestDto
                {
                    RequestGroupId = g.Min(x => x.ChangeID), // Use first ChangeID as group identifier
                    EmployeeId = g.Key.EmployeeID,
                    EmployeeName = g.First().Employee != null
                        ? $"{g.First().Employee!.FirstName} {g.First().Employee!.LastName}"
                        : "Unknown",
                    EmployeeCode = $"EMP{g.Key.EmployeeID:D4}",
                    Department = g.First().Employee?.Department?.DepartmentName ?? "N/A",
                    Status = g.First().Status,
                    RequestedDate = g.First().RequestedDate,
                    ApproverName = g.First().Approver != null
                        ? $"{g.First().Approver!.FirstName} {g.First().Approver!.LastName}"
                        : null,
                    ApprovalDate = g.First().ApprovalDate,
                    Changes = g.Select(c => new SensitiveFieldChangeDto
                    {
                        ChangeId = c.ChangeID,
                        FieldName = c.FieldName,
                        DisplayName = GetDisplayName(c.FieldName),
                        OldValue = MaskValue(c.FieldName, c.OldValue),
                        NewValue = c.NewValue
                    }).ToList()
                })
                .ToList();

            // Calculate stats from grouped data
            var allGroupedForStats = await _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                .Where(c => !c.FieldName.StartsWith("OTP_"))
                .Where(c => c.Status != "PendingOTP" && c.Status != "OTPGenerated")
                .OrderByDescending(c => c.RequestedDate)
                .ToListAsync();

            var allGrouped = allGroupedForStats
                .GroupBy(c => new
                {
                    c.EmployeeID,
                    RequestTime = new DateTime(
                        c.RequestedDate.Year,
                        c.RequestedDate.Month,
                        c.RequestedDate.Day,
                        c.RequestedDate.Hour,
                        c.RequestedDate.Minute,
                        0)
                })
                .Select(g => new { Status = g.First().Status })
                .ToList();

            var stats = new SensitiveRequestStatsDto
            {
                All = allGrouped.Count,
                Pending = allGrouped.Count(g => g.Status == "Pending"),
                Approved = allGrouped.Count(g => g.Status == "Approved"),
                Rejected = allGrouped.Count(g => g.Status == "Rejected")
            };

            var totalCount = grouped.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            // Apply pagination
            var pagedData = grouped
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            // Add permission info for each request
            foreach (var request in pagedData)
            {
                var permission = await _authService.GetApprovalPermissionAsync(currentUserId, request.EmployeeId);
                request.Permission = new RequestPermissionDto
                {
                    CanApprove = permission.CanApprove && request.Status == "Pending",
                    CanReject = permission.CanApprove && request.Status == "Pending",
                    Reason = permission.Reason,
                    IsSelfRequest = permission.IsSelfRequest,
                    RequiresHigherAuthority = permission.RequiresHigherAuthority,
                    SuggestedApprover = permission.SuggestedApprover
                };
            }

            // Get current user auth info
            var currentUserRoles = await _authService.GetUserRolesAsync(currentUserId);
            var currentUserLevel = _authService.GetRoleLevel(currentUserRoles);
            var roleLevelName = currentUserLevel switch
            {
                4 => "Admin",
                3 => "HR Manager",
                2 => "HR Employee",
                _ => "Standard"
            };

            return new SensitiveRequestListResponseDto
            {
                Data = pagedData,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                Stats = stats,
                CurrentUserAuth = new UserAuthorizationInfoDto
                {
                    UserId = currentUserId,
                    Roles = currentUserRoles,
                    RoleLevel = currentUserLevel,
                    RoleLevelName = roleLevelName,
                    CanApproveAny = currentUserLevel >= 2 // HR Employee and above can approve (some requests)
                }
            };
        }

        public async Task<GroupedSensitiveRequestDto?> GetSensitiveRequestByIdAsync(int requestGroupId, int currentUserId)
        {
            var firstChange = await _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.Approver)
                .FirstOrDefaultAsync(c => c.ChangeID == requestGroupId);

            if (firstChange == null) return null;

            // Get all changes for this request group (same employee, same minute)
            var requestTime = new DateTime(
                firstChange.RequestedDate.Year,
                firstChange.RequestedDate.Month,
                firstChange.RequestedDate.Day,
                firstChange.RequestedDate.Hour,
                firstChange.RequestedDate.Minute,
                0);

            var relatedChanges = await _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                .Include(c => c.Approver)
                .Where(c => c.EmployeeID == firstChange.EmployeeID)
                .Where(c => !c.FieldName.StartsWith("OTP_"))
                .Where(c => c.RequestedDate >= requestTime && c.RequestedDate < requestTime.AddMinutes(1))
                .ToListAsync();

            var result = new GroupedSensitiveRequestDto
            {
                RequestGroupId = requestGroupId,
                EmployeeId = firstChange.EmployeeID,
                EmployeeName = firstChange.Employee != null
                    ? $"{firstChange.Employee.FirstName} {firstChange.Employee.LastName}"
                    : "Unknown",
                EmployeeCode = $"EMP{firstChange.EmployeeID:D4}",
                Department = firstChange.Employee?.Department?.DepartmentName ?? "N/A",
                Status = firstChange.Status,
                RequestedDate = firstChange.RequestedDate,
                ApproverName = firstChange.Approver != null
                    ? $"{firstChange.Approver.FirstName} {firstChange.Approver.LastName}"
                    : null,
                ApprovalDate = firstChange.ApprovalDate,
                Changes = relatedChanges.Select(c => new SensitiveFieldChangeDto
                {
                    ChangeId = c.ChangeID,
                    FieldName = c.FieldName,
                    DisplayName = GetDisplayName(c.FieldName),
                    OldValue = c.OldValue,
                    NewValue = c.NewValue
                }).ToList()
            };

            // Add permission info
            var permission = await _authService.GetApprovalPermissionAsync(currentUserId, firstChange.EmployeeID);
            result.Permission = new RequestPermissionDto
            {
                CanApprove = permission.CanApprove && firstChange.Status == "Pending",
                CanReject = permission.CanApprove && firstChange.Status == "Pending",
                Reason = permission.Reason,
                IsSelfRequest = permission.IsSelfRequest,
                RequiresHigherAuthority = permission.RequiresHigherAuthority,
                SuggestedApprover = permission.SuggestedApprover
            };

            return result;
        }

        public async Task<ProcessSensitiveRequestResponseDto> ProcessRequestAsync(
            int requestGroupId,
            string action,
            int approverId,
            string? reason = null)
        {
            var firstChange = await _context.EmployeeProfileChanges
                .Include(c => c.Employee)
                .FirstOrDefaultAsync(c => c.ChangeID == requestGroupId);

            if (firstChange == null)
            {
                return new ProcessSensitiveRequestResponseDto
                {
                    Success = false,
                    Message = "Request not found"
                };
            }

            // Authorization check - verify approver can approve this request
            var permission = await _authService.GetApprovalPermissionAsync(approverId, firstChange.EmployeeID);
            if (!permission.CanApprove)
            {
                return new ProcessSensitiveRequestResponseDto
                {
                    Success = false,
                    Message = permission.Reason ?? "You don't have permission to process this request"
                };
            }

            // Check if request is still pending
            if (firstChange.Status != "Pending")
            {
                return new ProcessSensitiveRequestResponseDto
                {
                    Success = false,
                    Message = $"Request has already been {firstChange.Status.ToLower()}"
                };
            }

            // Get all related changes
            var requestTime = new DateTime(
                firstChange.RequestedDate.Year,
                firstChange.RequestedDate.Month,
                firstChange.RequestedDate.Day,
                firstChange.RequestedDate.Hour,
                firstChange.RequestedDate.Minute,
                0);

            var relatedChanges = await _context.EmployeeProfileChanges
                .Where(c => c.EmployeeID == firstChange.EmployeeID)
                .Where(c => !c.FieldName.StartsWith("OTP_"))
                .Where(c => c.RequestedDate >= requestTime && c.RequestedDate < requestTime.AddMinutes(1))
                .ToListAsync();

            var newStatus = action.ToLower() == "approve" ? "Approved" : "Rejected";
            var now = DateTime.Now;

            // Update all related changes
            foreach (var change in relatedChanges)
            {
                change.Status = newStatus;
                change.ApproverID = approverId;
                change.ApprovalDate = now;
            }

            // If approved, update the employee's actual data
            if (newStatus == "Approved" && firstChange.Employee != null)
            {
                foreach (var change in relatedChanges)
                {
                    switch (change.FieldName)
                    {
                        case "TaxID":
                            firstChange.Employee.TaxID = change.NewValue;
                            break;
                        case "BankAccountNumber":
                            firstChange.Employee.BankAccountNumber = change.NewValue;
                            break;
                        case "FirstName":
                            firstChange.Employee.FirstName = change.NewValue ?? firstChange.Employee.FirstName;
                            break;
                        case "LastName":
                            firstChange.Employee.LastName = change.NewValue ?? firstChange.Employee.LastName;
                            break;
                    }
                }

                // Add event for approved sensitive info update
                var lastEvent = await _context.EmployeeEvents
                    .Where(e => e.AggregateID == firstChange.EmployeeID)
                    .OrderByDescending(e => e.SequenceNumber)
                    .FirstOrDefaultAsync();

                int nextSequence = (lastEvent?.SequenceNumber ?? 0) + 1;

                var approvalEvent = new EmployeeEvent
                {
                    AggregateID = firstChange.EmployeeID,
                    EventType = "SensitiveInfoUpdateApproved",
                    EventData = JsonSerializer.Serialize(new
                    {
                        Changes = relatedChanges.ToDictionary(
                            c => c.FieldName,
                            c => new { Old = c.OldValue, New = c.NewValue }),
                        ApprovedAt = now,
                        ApprovedBy = approverId,
                        Reason = reason
                    }),
                    SequenceNumber = nextSequence,
                    EventVersion = 1,
                    CreatedBy = approverId,
                    CreatedAt = now
                };

                _context.EmployeeEvents.Add(approvalEvent);
            }
            else if (newStatus == "Rejected")
            {
                // Add event for rejected sensitive info update
                var lastEvent = await _context.EmployeeEvents
                    .Where(e => e.AggregateID == firstChange.EmployeeID)
                    .OrderByDescending(e => e.SequenceNumber)
                    .FirstOrDefaultAsync();

                int nextSequence = (lastEvent?.SequenceNumber ?? 0) + 1;

                var rejectionEvent = new EmployeeEvent
                {
                    AggregateID = firstChange.EmployeeID,
                    EventType = "SensitiveInfoUpdateRejected",
                    EventData = JsonSerializer.Serialize(new
                    {
                        Changes = relatedChanges.ToDictionary(
                            c => c.FieldName,
                            c => new { Old = c.OldValue, New = c.NewValue }),
                        RejectedAt = now,
                        RejectedBy = approverId,
                        Reason = reason
                    }),
                    SequenceNumber = nextSequence,
                    EventVersion = 1,
                    CreatedBy = approverId,
                    CreatedAt = now
                };

                _context.EmployeeEvents.Add(rejectionEvent);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Sensitive request {RequestId} for employee {EmployeeId} has been {Status} by approver {ApproverId}",
                requestGroupId, firstChange.EmployeeID, newStatus, approverId);

            return new ProcessSensitiveRequestResponseDto
            {
                Success = true,
                Message = $"Request has been {newStatus.ToLower()} successfully"
            };
        }

        private static string GetDisplayName(string fieldName)
        {
            return fieldName switch
            {
                "TaxID" => "Tax ID / CCCD",
                "BankAccountNumber" => "Bank Account",
                "FirstName" => "First Name",
                "LastName" => "Last Name",
                _ => fieldName
            };
        }

        private static string? MaskValue(string fieldName, string? value)
        {
            if (string.IsNullOrEmpty(value)) return value;

            // Only mask certain fields for display in list view
            if (fieldName == "TaxID" && value.Length > 4)
            {
                return new string('*', value.Length - 4) + value.Substring(value.Length - 4);
            }

            if (fieldName == "BankAccountNumber" && value.Length > 4)
            {
                return new string('*', value.Length - 4) + value.Substring(value.Length - 4);
            }

            return value;
        }
    }
}
