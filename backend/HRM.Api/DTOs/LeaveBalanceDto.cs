namespace HRM.Api.DTOs
{
    public class LeaveBalanceDto
    {
        public int LeaveTypeID { get; set; }
        public string Name { get; set; }
        public decimal DefaultQuota { get; set; }
        public decimal BalanceDays { get; set; }
        public DateTime LastUpdatedDate { get; set; }
    }

    public class LeaveBalanceResponseDto
    {
        public int EmployeeID { get; set; }
        public List<LeaveBalanceDto> Data { get; set; }
    }
}
