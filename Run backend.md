🟢 Backend Setup Guide (.NET 8 API)
1. Prerequisites

Trước khi chạy backend, cần đảm bảo:

Đã cài .NET 8 SDK

Đã pull đúng source code backend

File sau phải có trong repo:

HRM.Api.csproj

Program.cs

/Models

/Data/AppDbContext.cs

appsettings.json ✔ Very important

⚠️ Không được bỏ appsettings.json vào .gitignore
vì file này chứa connection string chạy DB.

Check version:

dotnet --version

2. Restore NuGet Packages

Sau khi pull code:

dotnet restore


NuGet sẽ tự tải đầy đủ các packages:

Entity Framework Core

SQL Server Provider

Swagger UI

JWT

etc.

3. Build Project
dotnet build

4. Run Backend

Có 2 cách chạy:

✔ Cách 1:
dotnet run

✔ Cách 2 (recommended for dev):
dotnet watch run

5. Verify API is running

Mở browser:

http://localhost:5204/swagger


hoặc test endpoint mặc định:

http://localhost:5204/weatherforecast

🎯 Kết luận

Chỉ cần:

dotnet restore
dotnet build
dotnet run


Là có thể chạy backend thành công — không cần thêm setup nào khác.