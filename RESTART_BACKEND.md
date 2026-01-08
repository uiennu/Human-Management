# Hướng dẫn Restart Backend

## Cách 1: Restart thủ công (Khuyến nghị)
1. Vào terminal đang chạy `dotnet run`
2. Nhấn `Ctrl + C` để dừng backend
3. Chạy lại: `dotnet run`

## Cách 2: Dùng script PowerShell
Chạy lệnh sau trong PowerShell:
```powershell
.\restart-backend.ps1
```

## Sau khi restart:
1. Đăng nhập với tài khoản **BOB**
2. Thực hiện một thay đổi bất kỳ trên Organization Chart (ví dụ: thêm employee vào team, update team, v.v.)
3. Vào trang Organization Logs
4. Log mới sẽ hiển thị **"Bob Tran"** thay vì "Alice Nguyen"

**Lưu ý:** Các log cũ vẫn sẽ hiển thị "Alice Nguyen" vì chúng được tạo bởi code cũ (hardcode PerformedBy = 1). Chỉ có log mới sau khi restart mới hiển thị đúng người thực hiện.
