using HRM.Api.Data;
using HRM.Api.Repositories;
using HRM.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using DotNetEnv;
using Microsoft.Extensions.FileProviders;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add JWT Authentication
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? builder.Configuration["Jwt:Secret"] ?? "super_secret_key_1234567890_super_long_key!";
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Add Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("EmployeeOnly", policy => policy.RequireRole("IT Employee", "IT Manager", "HR Manager", "HR Employee", "Admin", "Sales Manager", "Sales Employee", "Finance Manager", "Finance Employee", "BOD Assistant"));
    options.AddPolicy("ManagerOnly", policy => policy.RequireRole("IT Manager", "HR Manager", "Admin", "Sales Manager", "Finance Manager", "BOD Assistant"));
    options.AddPolicy("HROnly", policy => policy.RequireRole("HR Manager", "HR Employee", "Admin"));
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("CBOnly", policy => policy.RequireRole("HR Employee", "Admin"));
});

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
{
    // 1. Cấu hình kết nối MySQL
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));

    // 2. Cấu hình Log (PHẢI NẰM TRONG CẶP NGOẶC NHỌN NÀY)
    options.LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Information);
    options.EnableSensitiveDataLogging(); // Thêm dòng này để xem tham số SQL
});
    

// Register Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<ILeaveBalanceRepository, LeaveBalanceRepository>();
builder.Services.AddScoped<ILeaveRequestRepository, LeaveRequestRepository>();
builder.Services.AddScoped<IWorkHandoverRepository, WorkHandoverRepository>();
builder.Services.AddScoped<IEmployeeProfileRepository, EmployeeProfileRepository>();
builder.Services.AddScoped<IEmployeeProfileChangeRepository, EmployeeProfileChangeRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();

// Register Services
builder.Services.AddScoped<ILeaveBalanceService, LeaveBalanceService>();
builder.Services.AddScoped<ILeaveRequestService, LeaveRequestService>();
builder.Services.AddScoped<IWorkHandoverService, WorkHandoverService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IEmployeeProfileService, EmployeeProfileService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();
builder.Services.AddScoped<ITeamService, TeamService>();
builder.Services.AddScoped<IPasswordGenerator, PasswordGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();



// Register Resend client correctly
var resendApiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") 
    ?? builder.Configuration["Resend:ApiKey"]
    ?? "re_dummy_key"; // Fallback to prevent null exception if not configured

// Register the Resend client using the SDK's factory method
builder.Services.AddSingleton<Resend.IResend>(provider => Resend.ResendClient.Create(resendApiKey));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost3000", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddScoped<IOrganizationRepository, OrganizationRepository>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();

builder.Services.AddScoped<ITeamRepository, TeamRepository>(); 
builder.Services.AddScoped<ITeamService, TeamService>();

builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IReportService, ReportService>();

builder.Services.AddScoped<IEventReplayService, EventReplayService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<ICalendarServiceClient, CalendarServiceClient>();

// Register Sensitive Request Repository and Services (for HR management)
builder.Services.AddScoped<ISensitiveRequestRepository, SensitiveRequestRepository>();
builder.Services.AddScoped<ISensitiveRequestAuthorizationService, SensitiveRequestAuthorizationService>();
builder.Services.AddScoped<ISensitiveRequestService, SensitiveRequestService>();

var app = builder.Build();

// ⬇⬇⬇ THÊM ĐOẠN NÀY NGAY Ở ĐÂY
app.Use((ctx, next) =>
{
    ctx.Request.Scheme = "http";
    return next();
});


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


// app.UseHttpsRedirection();


// Enable CORS early so preflight (OPTIONS) requests are handled
app.UseCors("AllowLocalhost3000");

// Serve static files (uploads, etc.) - MUST be before auth to allow public access
app.UseStaticFiles();
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

// Kiểm tra nếu chưa có thư mục thì tạo mới để tránh lỗi
if (!Directory.Exists(uploadsPath)) {
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/weatherforecast", () => "OK");
app.MapGet("/", () => "HRM API Running...");

// Map controller routes (AuthController, LeaveController)
app.MapControllers();

app.Run();

