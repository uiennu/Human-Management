using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace HRM.Api.Services
{
    public class SensitiveRequestService : ISensitiveRequestService
    {
        private readonly ISensitiveRequestRepository _repository;
        private readonly ILogger<SensitiveRequestService> _logger;
        private readonly ISensitiveRequestAuthorizationService _authService;

        public SensitiveRequestService(
            ISensitiveRequestRepository repository, 
            ILogger<SensitiveRequestService> logger,
            ISensitiveRequestAuthorizationService authService)
        {
            _repository = repository;
            _logger = logger;
            _authService = authService;
        }

        #region Private Helper Methods

        /// <summary>
        /// Truncate DateTime to minute precision for grouping
        /// </summary>
        private static DateTime TruncateToMinute(DateTime dt)
        {
            return new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour, dt.Minute, 0);
        }

        /// <summary>
        /// Group changes by employee and request time
        /// </summary>
        private static List<IGrouping<(int EmployeeID, DateTime RequestTime), EmployeeProfileChange>> GroupChangesByRequest(
            IEnumerable<EmployeeProfileChange> changes)
        {
            return changes
                .GroupBy(c => (c.EmployeeID, RequestTime: TruncateToMinute(c.RequestedDate)))
                .ToList();
        }

        /// <summary>
        /// Map a group of changes to GroupedSensitiveRequestDto
        /// </summary>
        private static GroupedSensitiveRequestDto MapToGroupedDto(
            IGrouping<(int EmployeeID, DateTime RequestTime), EmployeeProfileChange> group,
            bool maskOldValues = true)
        {
            var first = group.First();
            
            // Collect all documents from all changes in the group
            var allDocuments = group
                .SelectMany(c => c.Documents)
                .Select(d => new DocumentInfoDto
                {
                    DocumentId = d.DocumentID,
                    DocumentPath = d.DocumentPath,
                    DocumentName = d.DocumentName,
                    UploadedDate = d.UploadedDate
                })
                .ToList();
            
            return new GroupedSensitiveRequestDto
            {
                RequestGroupId = group.Min(x => x.ChangeID),
                EmployeeId = group.Key.EmployeeID,
                EmployeeName = first.Employee != null
                    ? $"{first.Employee.FirstName} {first.Employee.LastName}"
                    : "Unknown",
                EmployeeCode = $"EMP{group.Key.EmployeeID:D4}",
                Department = first.Employee?.Department?.DepartmentName ?? "N/A",
                Status = first.Status,
                RequestedDate = first.RequestedDate,
                ApproverName = first.Approver != null
                    ? $"{first.Approver.FirstName} {first.Approver.LastName}"
                    : null,
                ApprovalDate = first.ApprovalDate,
                Changes = group.Select(c => new SensitiveFieldChangeDto
                {
                    ChangeId = c.ChangeID,
                    FieldName = c.FieldName,
                    DisplayName = GetDisplayName(c.FieldName),
                    OldValue = maskOldValues ? MaskValue(c.FieldName, c.OldValue) : c.OldValue,
                    NewValue = c.NewValue,
                    SupportingDocuments = c.Documents.Select(d => new DocumentInfoDto
                    {
                        DocumentId = d.DocumentID,
                        DocumentPath = d.DocumentPath,
                        DocumentName = d.DocumentName,
                        UploadedDate = d.UploadedDate
                    }).ToList()
                }).ToList(),
                SupportingDocuments = allDocuments
            };
        }

        /// <summary>
        /// Build RequestPermissionDto from authorization result
        /// </summary>
        private static RequestPermissionDto BuildPermissionDto(
            ApprovalPermissionDto permission, 
            string requestStatus)
        {
            return new RequestPermissionDto
            {
                CanApprove = permission.CanApprove && requestStatus == "Pending",
                CanReject = permission.CanApprove && requestStatus == "Pending",
                Reason = permission.Reason,
                IsSelfRequest = permission.IsSelfRequest,
                RequiresHigherAuthority = permission.RequiresHigherAuthority,
                SuggestedApprover = permission.SuggestedApprover
            };
        }

        /// <summary>
        /// Get role level display name
        /// </summary>
        private static string GetRoleLevelName(int level)
        {
            return level switch
            {
                4 => "Admin",
                3 => "HR Manager",
                2 => "HR Employee",
                _ => "Standard"
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

            if ((fieldName == "TaxID" || fieldName == "BankAccountNumber") && value.Length > 4)
            {
                return new string('*', value.Length - 4) + value.Substring(value.Length - 4);
            }

            return value;
        }

        #endregion

        public async Task<SensitiveRequestListResponseDto> GetAllSensitiveRequestsAsync(
            int currentUserId,
            string? status = null,
            int page = 1,
            int pageSize = 10,
            string? searchTerm = null)
        {
            var query = _repository.GetSensitiveRequestsQuery();

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

            // Get all changes and group them
            var allChanges = await query
                .OrderByDescending(c => c.RequestedDate)
                .ToListAsync();

            var grouped = GroupChangesByRequest(allChanges)
                .Select(g => MapToGroupedDto(g))
                .ToList();

            // Calculate stats (need to query all data without filters for accurate stats)
            var allChangesForStats = await _repository.GetSensitiveRequestsQuery()
                .OrderByDescending(c => c.RequestedDate)
                .ToListAsync();

            var statsGrouped = GroupChangesByRequest(allChangesForStats);
            var stats = new SensitiveRequestStatsDto
            {
                All = statsGrouped.Count,
                Pending = statsGrouped.Count(g => g.First().Status == "Pending"),
                Approved = statsGrouped.Count(g => g.First().Status == "Approved"),
                Rejected = statsGrouped.Count(g => g.First().Status == "Rejected")
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
                request.Permission = BuildPermissionDto(permission, request.Status);
            }

            // Get current user auth info
            var currentUserRoles = await _authService.GetUserRolesAsync(currentUserId);
            var currentUserLevel = _authService.GetRoleLevel(currentUserRoles);

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
                    RoleLevelName = GetRoleLevelName(currentUserLevel),
                    CanApproveAny = currentUserLevel >= 2
                }
            };
        }

        public async Task<GroupedSensitiveRequestDto?> GetSensitiveRequestByIdAsync(int requestGroupId, int currentUserId)
        {
            var firstChange = await _repository.GetByIdWithDetailsAsync(requestGroupId);

            if (firstChange == null) return null;

            // Get all changes for this request group (same employee, same minute)
            var relatedChanges = await _repository.GetRelatedChangesAsync(
                firstChange.EmployeeID, 
                firstChange.RequestedDate);

            // Use the common grouping and mapping
            var group = relatedChanges
                .GroupBy(c => (c.EmployeeID, RequestTime: TruncateToMinute(c.RequestedDate)))
                .First();

            var result = MapToGroupedDto(group, maskOldValues: false);
            result.RequestGroupId = requestGroupId; // Preserve the original ID

            // Add permission info
            var permission = await _authService.GetApprovalPermissionAsync(currentUserId, firstChange.EmployeeID);
            result.Permission = BuildPermissionDto(permission, firstChange.Status);

            return result;
        }

        public async Task<ProcessSensitiveRequestResponseDto> ProcessRequestAsync(
            int requestGroupId,
            string action,
            int approverId,
            string? reason = null)
        {
            var firstChange = await _repository.GetByIdWithDetailsAsync(requestGroupId);

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
            var relatedChanges = await _repository.GetRelatedChangesAsync(
                firstChange.EmployeeID, 
                firstChange.RequestedDate);

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
                var nextSequence = await _repository.GetNextEventSequenceNumberAsync(firstChange.EmployeeID);

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

                await _repository.AddEmployeeEventAsync(approvalEvent);
            }
            else if (newStatus == "Rejected")
            {
                // Add event for rejected sensitive info update
                var nextSequence = await _repository.GetNextEventSequenceNumberAsync(firstChange.EmployeeID);

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

                await _repository.AddEmployeeEventAsync(rejectionEvent);
            }

            await _repository.SaveChangesAsync();

            _logger.LogInformation(
                "Sensitive request {RequestId} for employee {EmployeeId} has been {Status} by approver {ApproverId}",
                requestGroupId, firstChange.EmployeeID, newStatus, approverId);

            return new ProcessSensitiveRequestResponseDto
            {
                Success = true,
                Message = $"Request has been {newStatus.ToLower()} successfully"
            };
        }
    }
}
