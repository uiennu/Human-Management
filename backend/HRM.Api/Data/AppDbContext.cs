using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HRM.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Existing DbSets
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<EmployeeRole> EmployeeRoles { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<EmployeeProfileChange> EmployeeProfileChanges { get; set; }

        // Leave Management DbSets
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<EmployeeLeaveBalance> EmployeeLeaveBalances { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<LeaveRequestHistory> LeaveRequestHistories { get; set; }
        public DbSet<WorkHandover> WorkHandovers { get; set; }
        public DbSet<EmployeeEvent> EmployeeEvents { get; set; }

        // Team Management DbSets
        public DbSet<SubTeam> SubTeams { get; set; }
        public DbSet<SubTeamMember> SubTeamMembers { get; set; }
        public DbSet<EmployeeEmergencyContact> EmployeeEmergencyContacts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            modelBuilder.Entity<EmployeeEvent>(entity =>
            {
                entity.ToTable("EmployeeEvents");
                entity.HasKey(e => e.EventID);
                
                // Báo cho EF biết cột này là kiểu json trong MySQL
                entity.Property(e => e.EventData).HasColumnType("json"); 
            });

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)         // Nhân viên có 1 phòng ban
                .WithMany()                        // Phòng ban có nhiều nhân viên (nếu trong Dept có List<Employee> thì điền vào, ko thì để trống)
                .HasForeignKey(e => e.DepartmentID) // QUAN TRỌNG NHẤT: Phải dùng cột này!
                .OnDelete(DeleteBehavior.SetNull); // Hoặc Restrict tuỳ bạn

    // 2. (Tuỳ chọn) Định nghĩa rõ mối quan hệ Manager để tránh nhầm lẫn
    // Nếu trong class Employee bạn KHÔNG có thuộc tính "ManagedDepartment" thì không cần dòng này cũng được, 
    // nhưng nên thêm để EF không tự suy diễn lung tung.
            modelBuilder.Entity<Department>()
                .HasOne(d => d.Manager)
                .WithMany() 
                .HasForeignKey(d => d.ManagerID)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
