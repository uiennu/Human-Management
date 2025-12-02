using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;

namespace HRM.Api.Services
{
    public interface IWorkHandoverService
    {
        Task<WorkHandoverDto> CreateWorkHandoverAsync(int managerId, CreateWorkHandoverDto dto);
        Task<List<WorkHandoverDto>> GetHandoversByLeaveRequestAsync(int leaveRequestId);
        Task<List<WorkHandoverDto>> GetMyHandoversAsync(int employeeId);
        Task<WorkHandoverDto?> GetHandoverDetailAsync(int handoverId);
        Task<bool> DeleteHandoverAsync(int handoverId, int managerId);
    }

    public class WorkHandoverService : IWorkHandoverService
    {
        private readonly IWorkHandoverRepository _workHandoverRepository;
        private readonly ILeaveRequestRepository _leaveRequestRepository;

        public WorkHandoverService(
            IWorkHandoverRepository workHandoverRepository,
            ILeaveRequestRepository leaveRequestRepository)
        {
            _workHandoverRepository = workHandoverRepository;
            _leaveRequestRepository = leaveRequestRepository;
        }

        public async Task<WorkHandoverDto> CreateWorkHandoverAsync(int managerId, CreateWorkHandoverDto dto)
        {
            var leaveRequest = await _leaveRequestRepository.GetByIdAsync(dto.LeaveRequestID);
            if (leaveRequest == null)
            {
                throw new Exception("Leave request not found");
            }

            var workHandover = new WorkHandover
            {
                LeaveRequestID = dto.LeaveRequestID,
                AssigneeEmployeeID = dto.AssigneeEmployeeID,
                ManagerID = managerId,
                HandoverNotes = dto.HandoverNotes,
                CreatedDate = DateTime.Now
            };

            await _workHandoverRepository.AddAsync(workHandover);
            await _workHandoverRepository.SaveAsync();

            var detailed = await _workHandoverRepository.GetByIdWithDetailsAsync(workHandover.HandoverID);
            return MapToDto(detailed!);
        }

        public async Task<List<WorkHandoverDto>> GetHandoversByLeaveRequestAsync(int leaveRequestId)
        {
            var handovers = await _workHandoverRepository.GetByLeaveRequestIdAsync(leaveRequestId);
            return handovers.Select(MapToDto).ToList();
        }

        public async Task<List<WorkHandoverDto>> GetMyHandoversAsync(int employeeId)
        {
            var handovers = await _workHandoverRepository.GetByEmployeeIdAsync(employeeId);
            return handovers.Select(MapToDto).ToList();
        }

        public async Task<WorkHandoverDto?> GetHandoverDetailAsync(int handoverId)
        {
            var handover = await _workHandoverRepository.GetByIdWithDetailsAsync(handoverId);
            if (handover == null) return null;
            return MapToDto(handover);
        }

        public async Task<bool> DeleteHandoverAsync(int handoverId, int managerId)
        {
            var handover = await _workHandoverRepository.GetByIdAsync(handoverId);
            if (handover == null || handover.ManagerID != managerId)
            {
                return false;
            }

            await _workHandoverRepository.DeleteAsync(handoverId);
            await _workHandoverRepository.SaveAsync();
            return true;
        }

        private WorkHandoverDto MapToDto(WorkHandover handover)
        {
            return new WorkHandoverDto
            {
                HandoverID = handover.HandoverID,
                LeaveRequestID = handover.LeaveRequestID,
                AssigneeEmployee = new EmployeeBasicDto
                {
                    EmployeeID = handover.AssigneeEmployee?.EmployeeID ?? 0,
                    FirstName = handover.AssigneeEmployee?.FirstName ?? "",
                    LastName = handover.AssigneeEmployee?.LastName ?? "",
                    Email = handover.AssigneeEmployee?.Email ?? ""
                },
                Manager = new EmployeeBasicDto
                {
                    EmployeeID = handover.Manager?.EmployeeID ?? 0,
                    FirstName = handover.Manager?.FirstName ?? "",
                    LastName = handover.Manager?.LastName ?? "",
                    Email = handover.Manager?.Email ?? ""
                },
                HandoverNotes = handover.HandoverNotes,
                CreatedDate = handover.CreatedDate
            };
        }
    }
}
