# Human Management (HRM) System 🚀

## Giới thiệu Dự án

Dự án **Human Management (HRM)** là một hệ thống quản lý nhân sự tập trung, được thiết kế để số hóa và tối ưu hóa các quy trình cốt lõi trong doanh nghiệp. Hệ thống phục vụ cho **Nhân viên, Quản lý, và Phòng Nhân sự (HR/C&B)**, cung cấp một nền tảng toàn diện để quản lý hồ sơ, yêu cầu hành chính, các hoạt động nội bộ và chính sách khen thưởng.

### Nhóm Thực hiện
* **22127076** - Lương Hoàng Dung
* **22127158** - Nhâm Đức Huy
* **22127433** - Nguyễn Ngọc Anh Tú
* **22127445** - Nguyễn Lâm Nhã Uyên
* **22127466** - Lê Nguyễn Yến Vy

## Công nghệ sử dụng (Technology Stack) 💻

Hệ thống được xây dựng dựa trên kiến trúc 3 lớp (Three-tier architecture) hiện đại.

| Lớp (Layer) | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend (UI)** | **ReactJS** | [cite_start]Giao diện người dùng hiện đại, mobile-responsive. |
| **Backend (API)** | **Java Spring MVC / .NET Core Web API** | Xử lý nghiệp vụ, xác thực (JWT/OAuth2), kiểm tra quyền truy cập (RBAC). |
| **Database** | **SQL Server / PostgreSQL** (Đề xuất) | Lưu trữ quan hệ, đảm bảo toàn vẹn dữ liệu. |
| **Tích hợp** | [cite_start]Email/SMS Service, Calendar API, Hệ thống tính lương (Payroll). |

## Yêu cầu Chức năng Cốt lõi (Core Functional Modules)

Hệ thống bao gồm 5 module chức năng chính:

### 1. Quản lý Hồ sơ Nhân viên (Core HR)
* **Cập nhật Hồ sơ Cá nhân (Employee Profile):** Cho phép nhân viên cập nhật thông tin cá nhân (SĐT, địa chỉ, liên hệ khẩn cấp). Thay đổi nhạy cảm cần phê duyệt từ HR.
* **Quản lý Cấu trúc Tổ chức (Organization Structure):** HR có thể thêm/sửa/xóa phòng ban, chỉ định quản lý và xem sơ đồ tổ chức trực quan.
* **Báo cáo Hồ sơ Nhân viên:** Quản lý có thể tạo báo cáo hồ sơ nhân viên dưới quyền quản lý.

### 2. Quản lý Yêu cầu (Employee Requests & Approval)
Thực hiện quy trình **Nhân viên Request $\rightarrow$ Quản lý Approve** cho các loại yêu cầu:
* **Yêu cầu Nghỉ phép (Leave Request):** Tạo, chỉnh sửa, hủy yêu cầu. Quản lý phê duyệt/từ chối (kèm lý do), và Bàn giao công việc khi phê duyệt.
* **Yêu cầu Cập nhật Bảng Chấm công (Update Time-sheet):** Điều chỉnh giờ làm việc, kèm minh chứng.
* **Yêu cầu Check-in/Check-out Bổ sung:** Bổ sung giờ làm khi quên chấm công.
* **Yêu cầu Làm việc từ xa (WFH Request):** Đăng ký ngày WFH kèm kế hoạch công việc.

### 3. Quản lý Cấu hình & Báo cáo Nghỉ phép (C&B Module)
* **Cấu hình Loại nghỉ phép:** Chuyên viên C&B thêm/chỉnh sửa/xóa loại nghỉ phép, đặt hạn mức mặc định và quy định áp dụng].
* **Điều chỉnh Số dư Ngày nghỉ:** C&B có thể **Thêm/Giảm** số ngày nghỉ phép của nhân viên trong các trường hợp đặc biệt (thưởng, phạt, điều chỉnh lỗi).
* **Tạo Báo cáo Sử dụng Ngày nghỉ phép:** C&B tạo báo cáo chi tiết và tổng hợp (theo phòng ban/cá nhân) dưới dạng Excel/PDF để phục vụ tính lương/kiểm toán.

### 4. Quản lý Chiến dịch & Hoạt động Nội bộ (Engagement)
* **Quản lý Chiến dịch:** HR tạo, chỉnh sửa, xóa các chiến dịch hoạt động (ví dụ: chạy bộ).
* **Tham gia Hoạt động:** Nhân viên đăng ký tham gia chiến dịch sắp diễn ra (cần đăng ký trước ít nhất 3 ngày).
* **Theo dõi & Báo cáo Kết quả:** HR/Quản lý theo dõi bảng xếp hạng, thành tích (ví dụ: số km chạy), và xuất báo cáo tổng kết chiến dịch.

### 5. Quản lý Khen thưởng (Reward Management)
* **Cấp Point:** HR cấp point khen thưởng hàng tháng theo định mức.
* **Tặng Point:** Quản lý có thể tặng point từ số dư cá nhân cho nhân viên dưới quyền.
* **Quy đổi Point:** Nhân viên xem số dư và có thể quy đổi point ra tiền mặt theo quy tắc định sẵn.

## Tiến độ Đồ án (Project Milestones)

Dự án được xây dựng theo các mốc nộp bài sau:

| Mốc | Mô tả công việc | Trạng thái (Ví dụ) |
| :--- | :--- | :--- |
| **Lần 1** | Phát biểu lại Đặc tả Hệ thống (SRS) và mô tả bằng User Story. | ⏳ Đang thực hiện |
| **Lần 2** | Phân tích chức năng (Sơ đồ Use Case, Prototype Giao diện, Sơ đồ Hoạt động/Sequence Diagram). | ⏳ Đang thực hiện |
| **Lần 3** | Thiết kế hệ thống (Giao diện web, Thiết kế Service/API, Thiết kế Database). | ⏳ Kế hoạch |
| **Lần 4** | Tích hợp hệ thống và Kiểm thử (Tích hợp Service, Hoàn chỉnh ứng dụng, Kiểm thử UAT). | ⏳ Kế hoạch |

## Yêu cầu Phi chức năng (Non-Functional Requirements)

* **Hiệu năng (Performance):** Đáp ứng $\le 200$ requests/second với thời gian phản hồi (TTFB) $< 300ms$ (p95). Hỗ trợ $50.000$ nhân viên.
* **Bảo mật (Security):** Xác thực **OAuth2/JWT**, ghi log truy cập mọi hành động, bảo vệ dữ liệu theo chuẩn **ISO 27001**, và kiểm tra quyền truy cập **RBAC** nghiêm ngặt.
* **Khả năng sử dụng (Usability):** Giao diện hỗ trợ **Tiếng Việt (VI)** và **Tiếng Anh (EN)**, mobile-responsive, thời gian tải trang $< 2$ giây.

---

### Liên hệ
* **Nhóm Thực hiện:** Lương Hoàng Dung, Nhâm Đức Huy, Nguyễn Ngọc Anh Tú, Nguyễn Lâm Nhã Uyên, Lê Nguyễn Yến Vy.
* **Giảng viên Hướng dẫn:** Phạm Minh Tú
