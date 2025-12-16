namespace HRM.Api.Models
{
    public class Employee
    {
        public int EmployeeID { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime HireDate { get; set; }
        public bool IsActive { get; set; } = true;
        public string? PersonalEmail { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelation { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? TaxID { get; set; }
        public int? DepartmentID { get; set; }
        public int? ManagerID { get; set; }
        public decimal CurrentPoints { get; set; } = 0;
        public string? AvatarUrl { get; set; }

        // Navigation properties
        public virtual Department? Department { get; set; }
        public virtual Employee? Manager { get; set; }
        public virtual ICollection<EmployeeRole> EmployeeRoles { get; set; } = new List<EmployeeRole>();
        public virtual ICollection<EmployeeLeaveBalance> LeaveBalances { get; set; } = new List<EmployeeLeaveBalance>();
        public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
        public virtual ICollection<EmployeeEmergencyContact> EmergencyContacts { get; set; } = new List<EmployeeEmergencyContact>();
    }
}
