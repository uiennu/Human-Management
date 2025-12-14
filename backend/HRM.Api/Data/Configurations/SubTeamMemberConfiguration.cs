using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRM.Api.Data.Configurations
{
    public class SubTeamMemberConfiguration : IEntityTypeConfiguration<SubTeamMember>
    {
        public void Configure(EntityTypeBuilder<SubTeamMember> builder)
        {
            builder.HasKey(stm => stm.ID);

            // Unique constraint: one employee can only be in one team
            builder.HasIndex(stm => stm.EmployeeID)
                .IsUnique();

            builder.HasOne(stm => stm.SubTeam)
                .WithMany(st => st.SubTeamMembers)
                .HasForeignKey(stm => stm.SubTeamID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(stm => stm.Employee)
                .WithMany()
                .HasForeignKey(stm => stm.EmployeeID)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
