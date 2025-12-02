using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HRM.Api.Data.Configurations
{
    public class WorkHandoverConfiguration : IEntityTypeConfiguration<WorkHandover>
    {
        public void Configure(EntityTypeBuilder<WorkHandover> builder)
        {
            builder.HasKey(wh => wh.HandoverID);
        }
    }
}
