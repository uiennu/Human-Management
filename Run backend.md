🟢 HRM System - Setup Guide (.NET 8 API + MySQL Docker)

Hướng dẫn cài đặt và triển khai hệ thống (Backend, Database, Frontend).

## 1. Prerequisites

Trước khi chạy backend, cần đảm bảo:

- **.NET 8 SDK**: Để chạy code .NET
- **Java 17 & Maven**: Để chạy Java Utility Service (nếu chạy local không dùng Docker)
- **Docker Desktop**: Để chạy database MySQL và Java Service (optional)
- **Node.js >= 18**: Để chạy Frontend (Next.js)

## 2. Default Accounts (Tài khoản mặc định)

Hệ thống đã được khởi tạo với dữ liệu mẫu cho đầy đủ các phòng ban. Mật khẩu mặc định cho tất cả tài khoản là **`123456`**.

| Role (Vai trò) | Name | Email | Password | Phòng ban |
| :--- | :--- | :--- | :--- | :--- |
| **Director (Admin)** | Alice Nguyen | `alice@hrm.com` | `123456` | Board of Directors (BOD) |
| **HR Manager** | Bob Tran | `bob@hrm.com` | `123456` | Human Resources |
| **IT Manager** | Charlie Le | `charlie@hrm.com` | `123456` | IT Development |
| **Sales Manager** | Frank Do | `frank@hrm.com` | `123456` | Sales & Marketing |
| **Finance Manager** | Grace Hoang | `grace@hrm.com` | `123456` | Finance |
| **IT Employee** | David Pham | `david@hrm.com` | `123456` | IT Development |
| **HR Employee** | Eve Vo | `eve@hrm.com` | `123456` | Human Resources |
| **Sales Employee** | Liam Dang | `liam@hrm.com` | `123456` | Sales & Marketing |
| **Finance Employee** | Mia Cao | `mia@hrm.com` | `123456` | Finance |

> **Lưu ý:** PasswordHash trong database (`$2a$11$jPe9...`) tương ứng với mật khẩu `123456`.

---

## 🚀 OPTION 1: RUN WITH DOCKER (Recommended)

Cách này nhanh nhất, không cần cài MySQL hay Java vào máy.

### Bước 1: Khởi động Database & Java Service
Mở terminal tại thư mục root (nơi có file `docker-compose.yml`) và chạy:

```bash
docker-compose up -d --build
```
> Lệnh này sẽ tự động chạy MySQL (Port 3306) và Java Utility Service (Port 8081).

### Bước 2: Chạy Backend API
Mở một terminal mới, trỏ vào thư mục Api:

```bash
cd backend/HRM.Api
dotnet restore
dotnet watch run
```

### 🛠 Docker Database Management (Quản lý DB trong Docker)

1. **Reset toàn bộ (Xóa hết dữ liệu cũ, nạp lại từ đầu):**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Nạp lại dữ liệu (Update) mà không tắt Server:**
*Chọn lệnh phù hợp với hệ điều hành của bạn:*

- **Windows (PowerShell):**
     ```powershell
     Get-Content src/Human-Management_mysql.sql | docker exec -i hrm_mysql mysql -u root -p123456 HRM_System
     ```

- **Windows (CMD):**
     ```cmd
     type src\Human-Management_mysql.sql | docker exec -i hrm_mysql mysql -u root -p123456 HRM_System
     ```

- **MacOS / Linux (Bash):**
     ```bash
     docker exec -i hrm_mysql mysql -u root -p123456 HRM_System < src/Human-Management_mysql.sql
     ```

---

## ⚠️ OPTION 2: RUN MANUALLY (No Docker)
Dành cho trường hợp bạn muốn dùng MySQL Workbench và chạy Java + .NET thủ công.

### Bước 1: Cấu hình Database (MySQL)

1. Mở MySQL Workbench (hoặc tool quản lý DB bất kỳ).
2. Tạo database và bảng bằng cách chạy script file: src/Human-Management_mysql.sql.
3. Mở file cấu hình Backend: backend/HRM.Api/appsettings.json.
4. Sửa ConnectionStrings để trỏ về MySQL của bạn:
- **JSON**
     ```bash
     "DefaultConnection": "Server=localhost;Database=HRM_System;User=root;Password=YOUR_PASSWORD;"
     ```
   *(Thay YOUR_PASSWORD bằng mật khẩu MySQL của bạn).*

### Bước 2: Chạy Java Utility Service
Lưu ý cấu hình: Mặc định Java Service dùng password 123456. Nếu mật khẩu MySQL của bạn khác, hãy mở file **backend-java/hrm-utility/src/main/resources/application.properties** và sửa dòng:
   ```bash
     spring.datasource.password=YOUR_PASSWORD
   ```
   *(Thay YOUR_PASSWORD bằng mật khẩu MySQL của bạn).*

### Bước 3: Chạy Service

1. Mở terminal, đi tới thư mục Java:
   ```bash
   cd backend-java/hrm-utility
   ```

2. Chạy lệnh:
   ```bash
   mvn spring-boot:run
   ```

### Bước 4: Chạy Backend API
1. Mở terminal mới, đi tới thư mục Api:
   ```bash
     cd backend/HRM.Api
     ```
2. Chạy lệnh:
     ```bash
     dotnet run
     ```

---

## 💻 FRONTEND SETUP (Next.js)
Sau khi Backend đã chạy (bằng Docker hoặc No Docker), hãy khởi động Frontend.

### Các bước thực hiện:

1. **Di chuyển vào thư mục frontend:**
*Từ thư mục root của project*
   ```bash
   cd frontend
   ```

2. **Cài đặt thư viện**
*Chỉ cần chạy lần đầu tiên*
   ```bash
   npm install
   ```

3. **Khởi động dự án:**
   ```bash
   npm run dev
   ```

4. **Truy cập Web App:** Mở trình duyệt tại: http://localhost:3000

---

## ✅ Verify Installation (Kiểm tra hệ thống)

- **Frontend:** http://localhost:3000
- **Swagger API:** http://localhost:5204/swagger
- **Java Service:** http://localhost:8081


