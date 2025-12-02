using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;
using HRM.Api.Constants;

namespace HRM.Api.Services
{
    public interface ILeaveRequestService
    {
        Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(int employeeId, CreateLeaveRequestDto dto);
        Task<PagedResultDto<LeaveRequestListItemDto>> GetLeaveRequestsAsync(int employeeId, string? status, string? dateRange, int? leaveTypeId, int page, int pageSize);
        Task<LeaveRequestDetailDto?> GetLeaveRequestDetailAsync(int requestId);
        Task<(bool success, string message)> CancelLeaveRequestAsync(int requestId, int employeeId);
        Task<List<LeaveTypeDto>> GetLeaveTypesAsync();
    }

    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly ILeaveRequestRepository _leaveRequestRepository;
        private readonly ILeaveBalanceRepository _leaveBalanceRepository;
        private readonly IFileStorageService _fileStorageService;

        public LeaveRequestService(
            ILeaveRequestRepository leaveRequestRepository,
            ILeaveBalanceRepository leaveBalanceRepository,
            IFileStorageService fileStorageService)
        {
            _leaveRequestRepository = leaveRequestRepository;
            _leaveBalanceRepository = leaveBalanceRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<List<LeaveTypeDto>> GetLeaveTypesAsync()
        {
            var types = await _leaveRequestRepository.GetLeaveTypesAsync();
            return types.Select(t => new LeaveTypeDto
            {
                LeaveTypeID = t.LeaveTypeID,
                Name = t.Name,
                Description = t.Description,
                DefaultQuota = t.DefaultQuota
            }).ToList();
        }

        public async Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(int employeeId, CreateLeaveRequestDto dto)
        {
            // Validate leave balance
            var balance = await _leaveBalanceRepository.GetByEmployeeAndLeaveTypeAsync(employeeId, dto.LeaveTypeID);
            if (balance == null || balance.BalanceDays < dto.TotalDays)
            {
                return new LeaveRequestResponseDto
                {
                    Status = "Error",
                    Message = "Insufficient leave balance"
                };
            }

            var leaveRequest = new LeaveRequest
            {
                EmployeeID = employeeId,
                LeaveTypeID = dto.LeaveTypeID,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsHalfDayStart = dto.IsHalfDayStart,
                IsHalfDayEnd = dto.IsHalfDayEnd,
                TotalDays = dto.TotalDays,
                Reason = dto.Reason,
                Status = LeaveStatus.Pending,
                RequestedDate = DateTime.Now
            };

            // 1. Save request first to get ID
            await _leaveRequestRepository.AddAsync(leaveRequest);
            await _leaveRequestRepository.SaveAsync();

            // 2. Handle file uploads if any
            if (dto.Attachments != null && dto.Attachments.Any())
            {
                var folderPath = $"uploads/leave/{employeeId}/{leaveRequest.LeaveRequestID}";
                var savedPath = await _fileStorageService.SaveFilesAsync(dto.Attachments, folderPath);
                
                // 3. Update request with folder path
                leaveRequest.AttachmentPath = savedPath;
                await _leaveRequestRepository.UpdateAsync(leaveRequest);
                await _leaveRequestRepository.SaveAsync();
            }

            return new LeaveRequestResponseDto
            {
                LeaveRequestID = leaveRequest.LeaveRequestID,
                Status = LeaveStatus.Pending,
                Message = "Leave request created successfully"
            };
        }

        public async Task<PagedResultDto<LeaveRequestListItemDto>> GetLeaveRequestsAsync(int employeeId, string? status, string? dateRange, int? leaveTypeId, int page, int pageSize)
        {
            var result = await _leaveRequestRepository.GetPagedAsync(employeeId, status, dateRange, leaveTypeId, page, pageSize);

            var data = result.Items.Select(r => new LeaveRequestListItemDto
            {
                LeaveRequestID = r.LeaveRequestID,
                LeaveTypeID = r.LeaveTypeID,
                LeaveTypeName = r.LeaveType?.Name ?? "Unknown",
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                TotalDays = r.TotalDays,
                Status = r.Status,
                RequestedDate = r.RequestedDate
            }).ToList();

            return new PagedResultDto<LeaveRequestListItemDto>
            {
                TotalItems = result.TotalItems,
                TotalPages = result.TotalPages,
                CurrentPage = result.CurrentPage,
                Data = data
            };
        }

        public async Task<LeaveRequestDetailDto?> GetLeaveRequestDetailAsync(int requestId)
        {
            var leaveRequest = await _leaveRequestRepository.GetByIdWithDetailsAsync(requestId);
            if (leaveRequest == null)
            {
                return null;
            }

            var detailDto = new LeaveRequestDetailDto
            {
                LeaveRequestID = leaveRequest.LeaveRequestID,
                EmployeeID = leaveRequest.EmployeeID,
                LeaveType = new LeaveTypeDto
                {
                    LeaveTypeID = leaveRequest.LeaveType?.LeaveTypeID ?? 0,
                    Name = leaveRequest.LeaveType?.Name ?? "Unknown"
                },
                StartDate = leaveRequest.StartDate,
                EndDate = leaveRequest.EndDate,
                IsHalfDayStart = leaveRequest.IsHalfDayStart,
                IsHalfDayEnd = leaveRequest.IsHalfDayEnd,
                TotalDays = leaveRequest.TotalDays,
                Reason = leaveRequest.Reason,
                Status = leaveRequest.Status,
                RequestedDate = leaveRequest.RequestedDate
            };

            if (!string.IsNullOrEmpty(leaveRequest.AttachmentPath))
            {
                detailDto.Attachments = _fileStorageService.GetFiles(leaveRequest.AttachmentPath);
            }

            return detailDto;
        }

        public async Task<(bool success, string message)> CancelLeaveRequestAsync(int requestId, int employeeId)
        {
            var leaveRequest = await _leaveRequestRepository.GetByIdAsync(requestId);
            if (leaveRequest == null)
            {
                return (false, "Leave request not found");
            }

            if (leaveRequest.EmployeeID != employeeId)
            {
                return (false, "Unauthorized");
            }

            if (leaveRequest.Status != LeaveStatus.Pending && leaveRequest.Status != LeaveStatus.Approved)
            {
                return (false, $"Cannot cancel a {leaveRequest.Status} request");
            }

            if (leaveRequest.Status == LeaveStatus.Approved && leaveRequest.StartDate <= DateTime.Now.Date)
            {
                return (false, "Cannot cancel leave that has already started");
            }

            leaveRequest.Status = LeaveStatus.Cancelled;
            await _leaveRequestRepository.UpdateAsync(leaveRequest);
            await _leaveRequestRepository.SaveAsync();

            return (true, "Request cancelled successfully");
        }
    }
}
