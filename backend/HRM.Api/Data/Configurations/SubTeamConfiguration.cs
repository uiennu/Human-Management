using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRM.Api.Data.Configurations
{
    public class SubTeamConfiguration : IEntityTypeConfiguration<SubTeam>
    {
        public void Configure(EntityTypeBuilder<SubTeam> builder)
        {
            builder.HasKey(st => st.SubTeamID);

            builder.Property(st => st.TeamName)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(st => st.Description)
                .HasMaxLength(500);

            builder.HasOne(st => st.Department)
                .WithMany(d => d.SubTeams)
                .HasForeignKey(st => st.DepartmentID)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(st => st.TeamLead)
                .WithMany()
                .HasForeignKey(st => st.TeamLeadID)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
