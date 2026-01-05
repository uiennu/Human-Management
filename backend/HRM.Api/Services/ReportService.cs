using HRM.Api.DTOs.Reports;
using HRM.Api.Repositories;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Colors;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Text; // <--- Cần thêm cái này để dùng StringBuilder
using iText.IO.Font.Constants; // Để dùng font Helvetica Bold
using iText.Kernel.Font;       // Để tạo PdfFont

namespace HRM.Api.Services
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _repository;

        public ReportService(IReportRepository repository)
        {
            _repository = repository;
            // ĐÃ XÓA CODE LICENSE EXCEL Ở ĐÂY ĐỂ HẾT LỖI 500
        }

        // ... (Hàm GenerateEmployeeProfileReportAsync giữ nguyên) ...
        public async Task<EmployeeReportResponseDto> GenerateEmployeeProfileReportAsync(EmployeeReportRequestDto request, int currentUserId)
        {
            var (items, totalCount) = await _repository.GetEmployeeReportDataAsync(request, currentUserId);
            var summary = await _repository.GetReportSummaryAsync(request, currentUserId);

            return new EmployeeReportResponseDto
            {
                Summary = summary,
                Data = new HRM.Api.DTOs.Reports.PagedResult<EmployeeReportItemDto>
                {
                    Items = items,
                    TotalItems = totalCount,
                    CurrentPage = request.Page,
                    TotalPages = request.PageSize > 0 ? (int)Math.Ceiling((double)totalCount / request.PageSize) : 1
                }
            };
        }

        public async Task<byte[]> ExportReportAsync(EmployeeReportRequestDto request, int currentUserId, string format)
        {
            request.Page = 1;
            request.PageSize = int.MaxValue; 
            
            var (items, _) = await _repository.GetEmployeeReportDataAsync(request, currentUserId);
            
            // Đổi Excel thành CSV
            if (format.ToLower() == "excel" || format.ToLower() == "csv")
            {
                return GenerateCsv(items);
            }
            else if (format.ToLower() == "pdf")
            {
                return GeneratePdf(items);
            }

            throw new ArgumentException("Invalid format");
        }

        // --- HÀM TẠO CSV (THAY THẾ EXCEL) ---
        private byte[] GenerateCsv(List<EmployeeReportItemDto> data)
        {
            var sb = new StringBuilder();

            // 1. Header
            sb.AppendLine("Full Name,Employee ID,Position,Department,Hire Date,Status");

            // 2. Data Rows
            foreach (var item in data)
            {
                // Xử lý dấu phẩy trong dữ liệu (nếu có) để tránh vỡ cột CSV
                var name = EscapeCsv(item.FullName);
                var pos = EscapeCsv(item.Position);
                var dept = EscapeCsv(item.Department);
                
                var line = $"{name},{item.EmployeeId},{pos},{dept},{item.HireDate:yyyy-MM-dd},{item.Status}";
                sb.AppendLine(line);
            }

            // Trả về mảng byte (có thêm BOM để Excel mở không bị lỗi font tiếng Việt)
            var preamble = Encoding.UTF8.GetPreamble();
            var body = Encoding.UTF8.GetBytes(sb.ToString());
            var combined = new byte[preamble.Length + body.Length];
            Array.Copy(preamble, combined, preamble.Length);
            Array.Copy(body, 0, combined, preamble.Length, body.Length);

            return combined;
        }

        // Hàm phụ trợ để bọc ngoặc kép nếu dữ liệu có dấu phẩy
        private string EscapeCsv(string field)
        {
            if (string.IsNullOrEmpty(field)) return "";
            if (field.Contains(",") || field.Contains("\"") || field.Contains("\n"))
            {
                return $"\"{field.Replace("\"", "\"\"")}\"";
            }
            return field;
        }

        private byte[] GeneratePdf(List<EmployeeReportItemDto> data)
        {
            using (var stream = new MemoryStream())
            {
                var writer = new PdfWriter(stream);
                var pdf = new PdfDocument(writer);
                var document = new Document(pdf);
                
                // --- 1. CẤU HÌNH FONT & MÀU SẮC ---
                // Tạo font in đậm chuẩn
                var boldFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);
                var regularFont = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
                
                // Màu xanh thương hiệu LeaveFlow (RGB: 37, 99, 235 - Blue 600 của Tailwind)
                var brandColor = new DeviceRgb(37, 99, 235); 
                var headerBgColor = new DeviceRgb(240, 245, 255); // Màu xanh nhạt cho nền Header bảng

                // --- 2. HEADER CÔNG TY (LeaveFlow) ---
                var companyName = new Paragraph("LeaveFlow")
                    .SetFont(boldFont)
                    .SetFontSize(24)
                    .SetFontColor(brandColor)
                    .SetMarginBottom(0);
                document.Add(companyName);

                var subTitle = new Paragraph("Employee Management System")
                    .SetFont(regularFont)
                    .SetFontSize(10)
                    .SetFontColor(ColorConstants.GRAY)
                    .SetMarginBottom(20);
                document.Add(subTitle);

                // --- 3. TIÊU ĐỀ BÁO CÁO ---
                var title = new Paragraph("EMPLOYEE PROFILE REPORT")
                    .SetFont(boldFont)
                    .SetFontSize(16)
                    .SetTextAlignment(TextAlignment.CENTER)
                    .SetFontColor(ColorConstants.BLACK);
                document.Add(title);

                document.Add(new Paragraph($"Generated on: {DateTime.Now:dd/MM/yyyy HH:mm}")
                    .SetFont(regularFont)
                    .SetFontSize(10)
                    .SetTextAlignment(TextAlignment.CENTER)
                    .SetMarginBottom(10));

                // --- 4. TẠO BẢNG (TABLE) ---
                // Định nghĩa tỷ lệ độ rộng các cột (Cột Tên & Dept rộng hơn)
                // Tổng cộng 6 cột: Name (3), ID (1.5), Position (2.5), Dept (2.5), Date (1.5), Status (1.5)
                float[] columnWidths = { 3, 1.5f, 2.5f, 2.5f, 1.5f, 1.5f };
                var table = new Table(UnitValue.CreatePercentArray(columnWidths)).UseAllAvailableWidth();

                // --- 5. STYLE HEADER CỦA BẢNG ---
                string[] headers = { "Full Name", "ID", "Position", "Department", "Hire Date", "Status" };
                
                foreach (var header in headers)
                {
                    var cell = new Cell().Add(new Paragraph(header));
                    cell.SetFont(boldFont);              // In đậm
                    cell.SetFontSize(10);
                    cell.SetBackgroundColor(brandColor); // Nền màu xanh thương hiệu
                    cell.SetFontColor(ColorConstants.WHITE); // Chữ màu trắng
                    cell.SetTextAlignment(TextAlignment.CENTER); // Canh giữa
                    cell.SetPadding(5);                  // Tạo khoảng cách cho thoáng
                    table.AddHeaderCell(cell);
                }

                // --- 6. ĐỔ DỮ LIỆU (ROWS) ---
                foreach (var item in data)
                {
                    // Hàm phụ trợ để tạo ô dữ liệu nhanh
                    Cell CreateCell(string text, TextAlignment alignment = TextAlignment.LEFT)
                    {
                        return new Cell().Add(new Paragraph(text ?? ""))
                            .SetFont(regularFont)
                            .SetFontSize(9)
                            .SetPadding(5)
                            .SetTextAlignment(alignment);
                    }

                    table.AddCell(CreateCell(item.FullName, TextAlignment.LEFT));
                    table.AddCell(CreateCell(item.EmployeeId, TextAlignment.CENTER)); // ID canh giữa
                    table.AddCell(CreateCell(item.Position, TextAlignment.LEFT));
                    table.AddCell(CreateCell(item.Department, TextAlignment.LEFT));
                    table.AddCell(CreateCell(item.HireDate.ToString("dd/MM/yyyy"), TextAlignment.CENTER)); // Ngày canh giữa
                    
                    // Tô màu text cho Status (Optional)
                    var statusCell = CreateCell(item.Status, TextAlignment.CENTER);
                    if (item.Status == "Active") statusCell.SetFontColor(new DeviceRgb(22, 163, 74)); // Green
                    else if (item.Status == "Terminated") statusCell.SetFontColor(ColorConstants.RED);
                    else statusCell.SetFontColor(ColorConstants.ORANGE); // On Leave
                    
                    table.AddCell(statusCell);
                }

                document.Add(table);

                // Footer (Optional)
                document.Add(new Paragraph("\n"));
                document.Add(new Paragraph("Confidential Document - For Internal Use Only")
                    .SetFontSize(8)
                    .SetFontColor(ColorConstants.GRAY)
                    .SetTextAlignment(TextAlignment.CENTER));

                document.Close();
                return stream.ToArray();
            }
        }

        public async Task<List<string>> GetDepartmentListAsync() => await _repository.GetDepartmentNamesAsync();
        public async Task<List<string>> GetSubTeamListAsync(string dept, int uid) => await _repository.GetSubTeamNamesAsync(dept, uid);
    }
}