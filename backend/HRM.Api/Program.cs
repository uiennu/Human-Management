using HRM.Api.Data;
using HRM.Api.Repositories;
using HRM.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

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

// Register Services
builder.Services.AddScoped<ILeaveBalanceService, LeaveBalanceService>();
builder.Services.AddScoped<ILeaveRequestService, LeaveRequestService>();
builder.Services.AddScoped<IWorkHandoverService, WorkHandoverService>();

builder.Services.AddCors();

var app = builder.Build();

// ⬇⬇⬇ THÊM ĐOẠN NÀY NGAY Ở ĐÂY
app.Use((ctx, next) =>
{
    ctx.Request.Scheme = "http";
    return next();
});
// ⬆⬆⬆ THÊM ĐÚNG VỊ TRÍ NÀY

// Cấu hình CORS cho phép frontend truy cập API
app.UseCors(policy =>
     policy.AllowAnyOrigin()
             .AllowAnyHeader()
             .AllowAnyMethod()
);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/weatherforecast", () => "OK");
app.MapGet("/", () => "HRM API Running...");



// Map controller routes (AuthController, LeaveController)
app.MapControllers();

app.Run();

app.Run();

