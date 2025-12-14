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
        private readonly ILeaveRequestRepository _leaveRequestRepository;

        public LeaveBalanceService(
            ILeaveBalanceRepository leaveBalanceRepository,
            ILeaveRequestRepository leaveRequestRepository)
        {
            _leaveBalanceRepository = leaveBalanceRepository;
            _leaveRequestRepository = leaveRequestRepository;
        }

        public async Task<LeaveBalanceResponseDto?> GetMyLeaveBalanceAsync(int employeeId)
        {
            // 1. Get all leave types to ensure we show everything
            var allLeaveTypes = await _leaveRequestRepository.GetLeaveTypesAsync();

            // FORCE MATERNITY LEAVE DISPLAY: If missing from DB, add a dummy one so it shows up as 0 days
            if (!allLeaveTypes.Any(t => t.Name == "Maternity Leave"))
            {
                allLeaveTypes.Add(new LeaveType 
                { 
                    LeaveTypeID = -999, // Dummy ID that won't match any real balance
                    Name = "Maternity Leave", 
                    DefaultQuota = 0 
                });
            }

            // 2. Get existing balances for the employee
            var existingBalances = await _leaveBalanceRepository.GetByEmployeeIdAsync(employeeId);
            
            // 3. Map to dictionary for easy lookup
            var balanceMap = existingBalances.ToDictionary(b => b.LeaveTypeID, b => b);

            var balanceList = new List<LeaveBalanceDto>();

            foreach (var type in allLeaveTypes)
            {
                if (balanceMap.TryGetValue(type.LeaveTypeID, out var balance))
                {
                    // Existing balance found
                    balanceList.Add(new LeaveBalanceDto
                    {
                        LeaveTypeID = type.LeaveTypeID,
                        Name = type.Name,
                        DefaultQuota = type.DefaultQuota,
                        BalanceDays = balance.BalanceDays,
                        LastUpdatedDate = balance.LastUpdatedDate
                    });
                }
                else
                {
                    // No balance record found, default to 0 (or DefaultQuota if logic dictates, but usually 0 if not allocated)
                    balanceList.Add(new LeaveBalanceDto
                    {
                        LeaveTypeID = type.LeaveTypeID,
                        Name = type.Name,
                        DefaultQuota = type.DefaultQuota,
                        BalanceDays = 0, // Default to 0 instead of DefaultQuota to avoid showing false entitlement
                        LastUpdatedDate = DateTime.Now
                    });
                }
            }

            return new LeaveBalanceResponseDto
            {
                EmployeeID = employeeId,
                Data = balanceList
            };
        }
    }
}
