🟢 Backend Setup Guide (.NET 8 API + MySQL Docker)

## 1. Prerequisites

Trước khi chạy backend, cần đảm bảo:

- **.NET 8 SDK**: Để chạy code .NET
- **Docker Desktop**: Để chạy database MySQL

## 2. Start Database (Docker)

Project này sử dụng MySQL chạy trên Docker. Bạn không cần cài MySQL thủ công.

1. Mở terminal tại thư mục root của project (nơi có file `docker-compose.yml`).
2. Chạy lệnh sau để khởi động database:

   docker-compose up -d


   > **Lưu ý**: Lệnh này sẽ tự động tải MySQL image và tạo database `HRM_System` kèm dữ liệu mẫu.

3. Kiểm tra container đã chạy chưa:

   docker ps

   Bạn sẽ thấy container tên `hrm_mysql` đang chạy.

## 3. Restore & Build

Sau khi pull code:


    cd backend/HRM.Api
    dotnet restore
    dotnet build


## 4. Run Backend

Có 2 cách chạy:

✔ **Cách 1**:
dotnet run

✔ **Cách 2 (recommended for dev)**:

dotnet watch run

## 5. Verify API is running

Mở browser:
- Swagger UI: http://localhost:5204/swagger
- Test endpoint: http://localhost:5204/weatherforecast

## 🎯 Tóm tắt các bước chạy

1. `docker-compose up -d` (Chỉ cần chạy 1 lần để bật DB)
2. `cd backend/HRM.Api`
3. `dotnet run`

---

## ⚠️ Option 2: Running with Local MySQL (No Docker)

Nếu bạn không dùng Docker mà cài MySQL trực tiếp (ví dụ dùng MySQL Workbench, XAMPP):

1. **Tạo Database**:
   - Mở MySQL Workbench.
   - Chạy script SQL tại: `src/Human-Management_mysql.sql`.
   - Script này sẽ tạo database `HRM_System` và các bảng.

2. **Cấu hình Backend**:
   - Mở file `backend/HRM.Api/appsettings.json`.
   - Sửa `ConnectionStrings` để trỏ về MySQL của bạn:
     ```json
     "DefaultConnection": "Server=localhost;Database=HRM_System;User=root;Password=YOUR_PASSWORD;"
     ```
   - Thay `YOUR_PASSWORD` bằng mật khẩu MySQL của bạn.

3. **Chạy Backend**:
   - `dotnet run` như bình thường.