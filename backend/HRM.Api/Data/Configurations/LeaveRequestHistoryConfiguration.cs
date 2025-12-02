using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRM.Api.Data.Configurations
{
    public class LeaveRequestHistoryConfiguration : IEntityTypeConfiguration<LeaveRequestHistory>
    {
        public void Configure(EntityTypeBuilder<LeaveRequestHistory> builder)
        {
            builder.HasKey(lrh => lrh.HistoryID);
        }
    }
}
