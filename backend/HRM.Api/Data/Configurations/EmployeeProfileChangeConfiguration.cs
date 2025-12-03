using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRM.Api.Data.Configurations
{
    public class EmployeeProfileChangeConfiguration : IEntityTypeConfiguration<EmployeeProfileChange>
    {
        public void Configure(EntityTypeBuilder<EmployeeProfileChange> builder)
        {
            builder.ToTable("EmployeeProfileChanges");
            builder.HasKey(e => e.ChangeID);
        }
    }
}
