using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;

namespace HRM.Api.Services
{
    public interface ILeaveRequestService
    {
        Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(int employeeId, CreateLeaveRequestDto dto);
        Task<PagedResultDto<LeaveRequestListItemDto>> GetLeaveRequestsAsync(int employeeId, string? status, int page, int pageSize);
        Task<LeaveRequestDetailDto?> GetLeaveRequestDetailAsync(int requestId);
        Task<(bool success, string message)> CancelLeaveRequestAsync(int requestId, int employeeId);
    }

    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly ILeaveRequestRepository _leaveRequestRepository;
        private readonly ILeaveBalanceRepository _leaveBalanceRepository;

        public LeaveRequestService(
            ILeaveRequestRepository leaveRequestRepository,
            ILeaveBalanceRepository leaveBalanceRepository)
        {
            _leaveRequestRepository = leaveRequestRepository;
            _leaveBalanceRepository = leaveBalanceRepository;
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
                AttachmentPath = dto.AttachmentPath,
                Status = "Pending",
                RequestedDate = DateTime.Now
            };

            await _leaveRequestRepository.AddAsync(leaveRequest);
            await _leaveRequestRepository.SaveAsync();

            return new LeaveRequestResponseDto
            {
                LeaveRequestID = leaveRequest.LeaveRequestID,
                Status = "Pending",
                Message = "Leave request created successfully"
            };
        }

        public async Task<PagedResultDto<LeaveRequestListItemDto>> GetLeaveRequestsAsync(int employeeId, string? status, int page, int pageSize)
        {
            var result = await _leaveRequestRepository.GetPagedAsync(employeeId, status, page, pageSize);

            var data = result.Items.Select(r => new LeaveRequestListItemDto
            {
                LeaveRequestID = r.LeaveRequestID,
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

            return new LeaveRequestDetailDto
            {
                LeaveRequestID = leaveRequest.LeaveRequestID,
                EmployeeID = leaveRequest.EmployeeID,
                LeaveType = new LeaveTypeDto
                {
                    ID = leaveRequest.LeaveType?.LeaveTypeID ?? 0,
                    Name = leaveRequest.LeaveType?.Name ?? "Unknown"
                },
                StartDate = leaveRequest.StartDate,
                EndDate = leaveRequest.EndDate,
                IsHalfDayStart = leaveRequest.IsHalfDayStart,
                IsHalfDayEnd = leaveRequest.IsHalfDayEnd,
                TotalDays = leaveRequest.TotalDays,
                Reason = leaveRequest.Reason,
                AttachmentPath = leaveRequest.AttachmentPath,
                Status = leaveRequest.Status,
                RequestedDate = leaveRequest.RequestedDate
            };
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

            if (leaveRequest.Status != "Pending" && leaveRequest.Status != "Approved")
            {
                return (false, $"Cannot cancel a {leaveRequest.Status} request");
            }

            if (leaveRequest.Status == "Approved" && leaveRequest.StartDate <= DateTime.Now.Date)
            {
                return (false, "Cannot cancel leave that has already started");
            }

            leaveRequest.Status = "Cancelled";
            await _leaveRequestRepository.UpdateAsync(leaveRequest);
            await _leaveRequestRepository.SaveAsync();

            return (true, "Request cancelled successfully");
        }
    }
}
