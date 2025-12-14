using HRM.Api.Models;

namespace HRM.Api.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            context.Database.EnsureCreated();

            // Look for any teams.
            if (context.SubTeams.Any())
            {
                return;   // DB has been seeded
            }

            var subTeams = new SubTeam[]
            {
                new SubTeam
                {
                    TeamName = "Backend Team",
                    Description = "Backend development team",
                    DepartmentID = 3, // Assuming IT Development is 3
                    TeamLeadID = 3    // Assuming Charlie is 3
                },
                new SubTeam
                {
                    TeamName = "Frontend Team",
                    Description = "Frontend development team",
                    DepartmentID = 3, // Assuming IT Development is 3
                    TeamLeadID = null
                },
                new SubTeam
                {
                    TeamName = "HR Operations",
                    Description = "HR operations team",
                    DepartmentID = 2, // Assuming HR is 2
                    TeamLeadID = 2    // Assuming Bob is 2
                }
            };

            context.SubTeams.AddRange(subTeams);
            context.SaveChanges();
        }
    }
}
