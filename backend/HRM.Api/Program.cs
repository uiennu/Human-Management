using HRM.Api.Data;
using HRM.Api.Repositories;
using HRM.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using DotNetEnv;

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
    options.AddPolicy("EmployeeOnly", policy => policy.RequireRole("IT Employee", "IT Manager", "HR Manager", "HR Employee", "Admin"));
    options.AddPolicy("ManagerOnly", policy => policy.RequireRole("IT Manager", "HR Manager", "Admin"));
    options.AddPolicy("HROnly", policy => policy.RequireRole("HR Manager", "HR Employee", "Admin"));
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("CBOnly", policy => policy.RequireRole("HR Employee", "Admin"));
});

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"), 
    ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));

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

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();

app.MapGet("/weatherforecast", () => "OK");
app.MapGet("/", () => "HRM API Running...");

// Map controller routes (AuthController, LeaveController)
app.MapControllers();

app.Run();

