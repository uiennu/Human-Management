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
| **Frontend (UI)** | **ReactJS** | [cite_start]Giao diện người dùng hiện đại, mobile-responsive[cite: 103, 583]. |
| **Backend (API)** | **Java Spring MVC / .NET Core Web API** | [cite_start]Xử lý nghiệp vụ, xác thực (JWT/OAuth2), kiểm tra quyền truy cập (RBAC)[cite: 104, 579, 581]. |
| **Database** | **SQL Server / PostgreSQL** (Đề xuất) | [cite_start]Lưu trữ quan hệ, đảm bảo toàn vẹn dữ liệu[cite: 105, 587]. |
| **Tích hợp** | [cite_start]Email/SMS Service, Calendar API, Hệ thống tính lương (Payroll)[cite: 106, 589, 590]. |

## Yêu cầu Chức năng Cốt lõi (Core Functional Modules)

Hệ thống bao gồm 5 module chức năng chính:

### [cite_start]1. Quản lý Hồ sơ Nhân viên (Core HR) [cite: 98, 409]
* [cite_start]**Cập nhật Hồ sơ Cá nhân (Employee Profile):** Cho phép nhân viên cập nhật thông tin cá nhân (SĐT, địa chỉ, liên hệ khẩn cấp)[cite: 414]. [cite_start]Thay đổi nhạy cảm cần phê duyệt từ HR[cite: 419].
* [cite_start]**Quản lý Cấu trúc Tổ chức (Organization Structure):** HR có thể thêm/sửa/xóa phòng ban, chỉ định quản lý và xem sơ đồ tổ chức trực quan[cite: 426].
* [cite_start]**Báo cáo Hồ sơ Nhân viên:** Quản lý có thể tạo báo cáo hồ sơ nhân viên dưới quyền quản lý[cite: 436, 438, 441].

### [cite_start]2. Quản lý Yêu cầu (Employee Requests & Approval) [cite: 96]
Thực hiện quy trình **Nhân viên Request $\rightarrow$ Quản lý Approve** cho các loại yêu cầu:
* **Yêu cầu Nghỉ phép (Leave Request):** Tạo, chỉnh sửa, hủy yêu cầu. [cite_start]Quản lý phê duyệt/từ chối (kèm lý do), và Bàn giao công việc khi phê duyệt[cite: 126, 191, 195, 218].
* [cite_start]**Yêu cầu Cập nhật Bảng Chấm công (Update Time-sheet)[cite: 337]:** Điều chỉnh giờ làm việc, kèm minh chứng.
* [cite_start]**Yêu cầu Check-in/Check-out Bổ sung[cite: 350]:** Bổ sung giờ làm khi quên chấm công.
* [cite_start]**Yêu cầu Làm việc từ xa (WFH Request)[cite: 363]:** Đăng ký ngày WFH kèm kế hoạch công việc.

### [cite_start]3. Quản lý Cấu hình & Báo cáo Nghỉ phép (C&B Module) [cite: 101, 264]
* [cite_start]**Cấu hình Loại nghỉ phép:** Chuyên viên C&B thêm/chỉnh sửa/xóa loại nghỉ phép, đặt hạn mức mặc định và quy định áp dụng[cite: 265, 268, 286, 303].
* [cite_start]**Điều chỉnh Số dư Ngày nghỉ:** C&B có thể **Thêm/Giảm** số ngày nghỉ phép của nhân viên trong các trường hợp đặc biệt (thưởng, phạt, điều chỉnh lỗi)[cite: 277, 294].
* [cite_start]**Tạo Báo cáo Sử dụng Ngày nghỉ phép:** C&B tạo báo cáo chi tiết và tổng hợp (theo phòng ban/cá nhân) dưới dạng Excel/PDF để phục vụ tính lương/kiểm toán[cite: 312, 324].

### [cite_start]4. Quản lý Chiến dịch & Hoạt động Nội bộ (Engagement) [cite: 99]
* [cite_start]**Quản lý Chiến dịch:** HR tạo, chỉnh sửa, xóa các chiến dịch hoạt động (ví dụ: chạy bộ)[cite: 450, 464, 478].
* [cite_start]**Tham gia Hoạt động:** Nhân viên đăng ký tham gia chiến dịch sắp diễn ra (cần đăng ký trước ít nhất 3 ngày)[cite: 513, 516, 521].
* [cite_start]**Theo dõi & Báo cáo Kết quả:** HR/Quản lý theo dõi bảng xếp hạng, thành tích (ví dụ: số km chạy), và xuất báo cáo tổng kết chiến dịch[cite: 488, 501].

### [cite_start]5. Quản lý Khen thưởng (Reward Management) [cite: 100, 525]
* [cite_start]**Cấp Point:** HR cấp point khen thưởng hàng tháng theo định mức[cite: 528].
* [cite_start]**Tặng Point:** Quản lý có thể tặng point từ số dư cá nhân cho nhân viên dưới quyền[cite: 539].
* [cite_start]**Quy đổi Point:** Nhân viên xem số dư và có thể quy đổi point ra tiền mặt theo quy tắc định sẵn[cite: 563, 565].

## Tiến độ Đồ án (Project Milestones)

Dự án được xây dựng theo các mốc nộp bài sau:

| Mốc | Mô tả công việc | Trạng thái (Ví dụ) |
| :--- | :--- | :--- |
| **Lần 1** | Phát biểu lại Đặc tả Hệ thống (SRS) và mô tả bằng User Story. | ✅ Hoàn thành |
| **Lần 2** | Phân tích chức năng (Sơ đồ Use Case, Prototype Giao diện, Sơ đồ Hoạt động/Sequence Diagram). | ⏳ Đang thực hiện |
| **Lần 3** | Thiết kế hệ thống (Giao diện web, Thiết kế Service/API, Thiết kế Database). | ⏳ Kế hoạch |
| **Lần 4** | Tích hợp hệ thống và Kiểm thử (Tích hợp Service, Hoàn chỉnh ứng dụng, Kiểm thử UAT). | ⏳ Kế hoạch |

## Yêu cầu Phi chức năng (Non-Functional Requirements)

* [cite_start]**Hiệu năng (Performance):** Đáp ứng $\le 200$ requests/second với thời gian phản hồi (TTFB) $< 300ms$ (p95)[cite: 576]. [cite_start]Hỗ trợ $50.000$ nhân viên[cite: 577].
* [cite_start]**Bảo mật (Security):** Xác thực **OAuth2/JWT**, ghi log truy cập mọi hành động, bảo vệ dữ liệu theo chuẩn **ISO 27001**, và kiểm tra quyền truy cập **RBAC** nghiêm ngặt[cite: 579, 580, 581].
* [cite_start]**Khả năng sử dụng (Usability):** Giao diện hỗ trợ **Tiếng Việt (VI)** và **Tiếng Anh (EN)**, mobile-responsive, thời gian tải trang $< 2$ giây[cite: 583, 584].

---

### Liên hệ
* **Nhóm Thực hiện:** Lương Hoàng Dung, Nhâm Đức Huy, Nguyễn Ngọc Anh Tú, Nguyễn Lâm Nhã Uyên, Lê Nguyễn Yến Vy.
* **Giảng viên Hướng dẫn:** [Tên Giảng viên]
