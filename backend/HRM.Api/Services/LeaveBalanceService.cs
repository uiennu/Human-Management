using HRM.Api.DTOs;
using HRM.Api.Models;
using HRM.Api.Repositories;

namespace HRM.Api.Services
{
    public interface ILeaveBalanceService
    {
        Task<LeaveBalanceResponseDto?> GetMyLeaveBalanceAsync(int employeeId);
    }

    public class LeaveBalanceService : ILeaveBalanceService
    {
        private readonly ILeaveBalanceRepository _leaveBalanceRepository;

        public LeaveBalanceService(ILeaveBalanceRepository leaveBalanceRepository)
        {
            _leaveBalanceRepository = leaveBalanceRepository;
        }

        public async Task<LeaveBalanceResponseDto?> GetMyLeaveBalanceAsync(int employeeId)
        {
            var balances = await _leaveBalanceRepository.GetByEmployeeIdAsync(employeeId);

            if (balances == null || balances.Count == 0)
            {
                return null;
            }

            var balanceList = balances.Select(b => new LeaveBalanceDto
            {
                LeaveTypeID = b.LeaveTypeID,
                Name = b.LeaveType?.Name ?? "Unknown",
                DefaultQuota = b.LeaveType?.DefaultQuota ?? 0,
                BalanceDays = b.BalanceDays,
                LastUpdatedDate = b.LastUpdatedDate
            }).ToList();

            return new LeaveBalanceResponseDto
            {
                EmployeeID = employeeId,
                Data = balanceList
            };
        }
    }
}
