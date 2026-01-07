using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;
using HRM.Api.Constants;
using Microsoft.EntityFrameworkCore;
using HRM.Api.Data;

namespace HRM.Api.Services
{
    public interface ILeaveRequestService
    {
        Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(int employeeId, CreateLeaveRequestDto dto);
        Task<PagedResultDto<LeaveRequestListItemDto>> GetLeaveRequestsAsync(int employeeId, string? status, string? dateRange, int? leaveTypeId, int page, int pageSize);
        Task<LeaveRequestDetailDto?> GetLeaveRequestDetailAsync(int requestId);
        Task<(bool success, string message)> CancelLeaveRequestAsync(int requestId, int employeeId);
        
        // --- THÊM 2 HÀM MỚI ---
        Task<(bool success, string message)> ApproveLeaveRequestAsync(int requestId, int managerId, string? comment);
        Task<(bool success, string message)> RejectLeaveRequestAsync(int requestId, int managerId, string? comment);
        // ---------------------

        Task<List<LeaveTypeDto>> GetLeaveTypesAsync();
        Task<string?> GetPrimaryApproverNameAsync(int employeeId);
        Task<List<LeaveRequestListItemDto>> GetLeaveRequestsByEmployeeAsync(int employeeId);
    }

    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly ILeaveRequestRepository _leaveRequestRepository;
        private readonly ILeaveBalanceRepository _leaveBalanceRepository;
        private readonly IFileStorageService _fileStorageService;
        private readonly ICalendarServiceClient _calendarServiceClient;

        public LeaveRequestService(
            ILeaveRequestRepository leaveRequestRepository,
            ILeaveBalanceRepository leaveBalanceRepository,
            IFileStorageService fileStorageService,
            ICalendarServiceClient calendarServiceClient)
        {
            _leaveRequestRepository = leaveRequestRepository;
            _leaveBalanceRepository = leaveBalanceRepository;
            _fileStorageService = fileStorageService;
            _calendarServiceClient = calendarServiceClient;
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

        public async Task<string?> GetPrimaryApproverNameAsync(int employeeId)
        {
            var employee = await _leaveRequestRepository.GetContext().Set<Employee>()
                .Include(e => e.Manager)
                .FirstOrDefaultAsync(e => e.EmployeeID == employeeId);

            if (employee == null || employee.Manager == null) return null;

            return $"{employee.Manager.FirstName} {employee.Manager.LastName}";
        }

        public async Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(int employeeId, CreateLeaveRequestDto dto)
        {
            var employee = await _leaveRequestRepository.GetContext().Set<Employee>()
                .FirstOrDefaultAsync(e => e.EmployeeID == employeeId);
            
            if (employee == null)
            {
                return new LeaveRequestResponseDto { Status = "Error", Message = "Employee not found" };
            }

            // Check holidays
            var holidays = await _calendarServiceClient.GetHolidaysInRangeAsync(dto.StartDate, dto.EndDate);
            if (holidays.Any()) Console.WriteLine($"[HolidayService] Found {holidays.Count} holidays.");

            // --- 1. LOGIC CHỈ CHECK, KHÔNG TRỪ ---
            var leaveType = await _leaveRequestRepository.GetContext().Set<LeaveType>()
                .FirstOrDefaultAsync(t => t.LeaveTypeID == dto.LeaveTypeID);

            bool isUnpaidLeave = leaveType != null && 
                                (leaveType.Name.ToLower().Contains("unpaid") || 
                                 leaveType.Name.ToLower().Contains("no pay"));

            if (!isUnpaidLeave)
            {
                var balance = await _leaveBalanceRepository.GetByEmployeeAndLeaveTypeAsync(employeeId, dto.LeaveTypeID);
                
                // Tính tổng ngày đang Pending để chặn spam đơn
                var pendingDays = await _leaveRequestRepository.GetContext().Set<LeaveRequest>()
                    .Where(r => r.EmployeeID == employeeId && r.LeaveTypeID == dto.LeaveTypeID && r.Status == LeaveStatus.Pending)
                    .SumAsync(r => r.TotalDays);

                var availableBalance = (balance?.BalanceDays ?? 0) - pendingDays;

                if (availableBalance < dto.TotalDays)
                {
                    return new LeaveRequestResponseDto
                    {
                        Status = "Error",
                        Message = $"Insufficient leave balance. Available (minus pending): {availableBalance}, Requested: {dto.TotalDays}"
                    };
                }
            }
            // -------------------------------------

            var leaveRequest = new LeaveRequest
            {
                EmployeeID = employeeId,
                ManagerID = employee.ManagerID ?? employeeId,
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

            await _leaveRequestRepository.AddAsync(leaveRequest);
            await _leaveRequestRepository.SaveAsync();

            if (dto.Attachments != null && dto.Attachments.Any())
            {
                var folderPath = $"uploads/leave/{employeeId}/{leaveRequest.LeaveRequestID}";
                var savedPath = await _fileStorageService.SaveFilesAsync(dto.Attachments, folderPath);
                
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
            if (leaveRequest == null) return null;

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
                EmployeeName = $"{leaveRequest.Employee?.FirstName} {leaveRequest.Employee?.LastName}",
                RequestedDate = leaveRequest.RequestedDate
            };

            if (!string.IsNullOrEmpty(leaveRequest.AttachmentPath))
            {
                detailDto.Attachments = _fileStorageService.GetFiles(leaveRequest.AttachmentPath);
            }

            if ((leaveRequest.Status == LeaveStatus.Approved || leaveRequest.Status == LeaveStatus.Rejected) 
                && leaveRequest.ApprovedDate.HasValue)
            {
                detailDto.ApprovalInfo = new ApprovalInfoDto
                {
                    ApproverName = $"{leaveRequest.Manager?.FirstName} {leaveRequest.Manager?.LastName}",
                    ActionDate = leaveRequest.ApprovedDate.Value,
                    Note = leaveRequest.ApprovalNote
                };
            }
            else if (leaveRequest.Histories != null && leaveRequest.Histories.Any())
            {
                var approvalHistory = leaveRequest.Histories
                    .Where(h => h.Status == LeaveStatus.Approved || h.Status == LeaveStatus.Rejected)
                    .OrderByDescending(h => h.ChangeDate)
                    .FirstOrDefault();

                if (approvalHistory != null && approvalHistory.ChangedByEmployee != null)
                {
                    detailDto.ApprovalInfo = new ApprovalInfoDto
                    {
                        ApproverName = $"{approvalHistory.ChangedByEmployee.FirstName} {approvalHistory.ChangedByEmployee.LastName}",
                        ActionDate = approvalHistory.ChangeDate,
                        Note = approvalHistory.Notes
                    };
                }
            }

            return detailDto;
        }

        public async Task<(bool success, string message)> CancelLeaveRequestAsync(int requestId, int employeeId)
        {
            var leaveRequest = await _leaveRequestRepository.GetByIdWithDetailsAsync(requestId);

            if (leaveRequest == null) return (false, "Leave request not found");
            if (leaveRequest.EmployeeID != employeeId) return (false, "Unauthorized");

            if (leaveRequest.Status != LeaveStatus.Pending && leaveRequest.Status != LeaveStatus.Approved)
            {
                return (false, $"Cannot cancel a {leaveRequest.Status} request");
            }

            if (leaveRequest.Status == LeaveStatus.Approved && leaveRequest.StartDate <= DateTime.Now.Date)
            {
                return (false, "Cannot cancel leave that has already started");
            }

            // --- HOÀN LẠI BALANCE NẾU ĐÃ APPROVED VÀ CÓ TÍNH LƯƠNG ---
            bool isUnpaidLeave = leaveRequest.LeaveType != null && 
                                (leaveRequest.LeaveType.Name.ToLower().Contains("unpaid") || 
                                 leaveRequest.LeaveType.Name.ToLower().Contains("no pay"));

            if (!isUnpaidLeave && leaveRequest.Status == LeaveStatus.Approved)
            {
                var balance = await _leaveBalanceRepository.GetByEmployeeAndLeaveTypeAsync(employeeId, leaveRequest.LeaveTypeID);
                if (balance != null)
                {
                    balance.BalanceDays += leaveRequest.TotalDays;
                    await _leaveBalanceRepository.UpdateAsync(balance);
                }
            }
            // ---------------------------------------------------------

            leaveRequest.Status = LeaveStatus.Cancelled;
            await _leaveRequestRepository.UpdateAsync(leaveRequest);
            await _leaveRequestRepository.SaveAsync();

            return (true, "Request cancelled successfully");
        }

        // --- HÀM APPROVE MỚI: DUYỆT VÀ TRỪ PHÉP ---
        public async Task<(bool success, string message)> ApproveLeaveRequestAsync(int requestId, int managerId, string? comment)
        {
            var request = await _leaveRequestRepository.GetByIdWithDetailsAsync(requestId);
            if (request == null) return (false, "Request not found");

            if (request.Status != LeaveStatus.Pending) return (false, "Request is not pending");

            // Check Unpaid
            bool isUnpaidLeave = request.LeaveType != null && 
                                (request.LeaveType.Name.ToLower().Contains("unpaid") || 
                                 request.LeaveType.Name.ToLower().Contains("no pay"));

            // Nếu Paid -> Trừ Balance
            if (!isUnpaidLeave)
            {
                var balance = await _leaveBalanceRepository.GetByEmployeeAndLeaveTypeAsync(request.EmployeeID, request.LeaveTypeID);
                
                if (balance == null || balance.BalanceDays < request.TotalDays)
                {
                    return (false, "Insufficient leave balance to approve");
                }

                // Trừ thật sự ở đây
                balance.BalanceDays -= request.TotalDays;
                await _leaveBalanceRepository.UpdateAsync(balance);
            }

            // Update Status
            request.Status = LeaveStatus.Approved;
            request.ApprovalNote = comment;
            request.ApprovedDate = DateTime.Now;

            await _leaveRequestRepository.UpdateAsync(request);
            await _leaveRequestRepository.SaveAsync();

            return (true, "Request approved successfully");
        }

        // --- HÀM REJECT MỚI ---
        public async Task<(bool success, string message)> RejectLeaveRequestAsync(int requestId, int managerId, string? comment)
        {
            var request = await _leaveRequestRepository.GetByIdAsync(requestId);
            if (request == null) return (false, "Request not found");

            if (request.Status != LeaveStatus.Pending) return (false, "Request is not pending");

            request.Status = LeaveStatus.Rejected;
            request.ApprovalNote = comment;
            request.ApprovedDate = DateTime.Now; // Vẫn lưu ngày thao tác

            await _leaveRequestRepository.UpdateAsync(request);
            await _leaveRequestRepository.SaveAsync();

            return (true, "Request rejected successfully");
        }

        public async Task<List<LeaveRequestListItemDto>> GetLeaveRequestsByEmployeeAsync(int employeeId)
        {
            var context = _leaveRequestRepository.GetContext();
            var leaveRequests = await context.LeaveRequests
                .Include(l => l.LeaveType)
                .Where(l => l.EmployeeID == employeeId)
                .OrderByDescending(l => l.RequestedDate)
                .ToListAsync();

            return leaveRequests.Select(r => new LeaveRequestListItemDto
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
        }
    }
}