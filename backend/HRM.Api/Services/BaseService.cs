using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HRM.Api.Services
{
    public abstract class BaseService
    {
        protected readonly AppDbContext _context;
        protected readonly ICurrentUserService _currentUserService;

        public BaseService(AppDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// Hàm "Vạn năng": Xử lý cả Thêm Mới và Cập Nhật kèm Event Sourcing
        /// </summary>
        /// <param name="entity">Đối tượng Employee đang thao tác</param>
        /// <param name="eventType">Tên sự kiện (VD: EmployeeCreated, InfoUpdated)</param>
        protected async Task<int> SaveChangesWithEventAsync(Employee entity, string eventType)
        {
            // 1. Kiểm tra trạng thái của Entity (Đang là Thêm mới hay Sửa?)
            var entry = _context.Entry(entity);
            int performedBy = _currentUserService.GetCurrentEmployeeId();
            
            // =========================================================
            // TRƯỜNG HỢP 1: THÊM MỚI (CREATE)
            // =========================================================
            if (entry.State == EntityState.Added)
            {
                // Bước A: Phải SaveChanges trước để DB sinh ra EmployeeID
                await _context.SaveChangesAsync(); 
                
                // Lúc này entity.EmployeeID đã có giá trị (VD: 10, 11...)
                int newEmployeeId = entity.EmployeeID;

                // Bước B: Tạo Event (Với Create, ta lưu toàn bộ thông tin nhân viên)
                var newEvent = new EmployeeEvent
                {
                    AggregateID = newEmployeeId,
                    EventType = eventType, // VD: "EmployeeCreated"
                    // Serialize toàn bộ object Employee thành JSON
                    EventData = JsonSerializer.Serialize(entity), 
                    SequenceNumber = 1, // Tạo mới thì luôn là sequence 1
                    EventVersion = 1, // Default schema version
                    CreatedBy = performedBy,
                    CreatedAt = DateTime.Now
                };

                _context.EmployeeEvents.Add(newEvent);
                
                // Bước C: Save lần nữa để lưu Event
                return await _context.SaveChangesAsync();
            }

            // =========================================================
            // TRƯỜNG HỢP 2: CẬP NHẬT (UPDATE)
            // =========================================================
            else if (entry.State == EntityState.Modified)
            {
                var changes = new Dictionary<string, object>();
                foreach (var prop in entry.Properties)
                {
                    if (prop.IsModified)
                    {
                        // Chỉ lưu nếu giá trị thực sự thay đổi
                        var oldVal = prop.OriginalValue;
                        var newVal = prop.CurrentValue;
                        
                        // So sánh giá trị (null-safe)
                        bool isChanged = oldVal == null && newVal != null ||
                                       oldVal != null && newVal == null ||
                                       oldVal != null && newVal != null && !oldVal.Equals(newVal);
                        
                        if (isChanged)
                        {
                            changes.Add(prop.Metadata.Name, new 
                            { 
                                Old = oldVal, 
                                New = newVal 
                            });
                        }
                    }
                }

                if (changes.Count > 0)
                {
                    changes.Add("UpdatedAt", DateTime.Now);

                    // Tính SequenceNumber tiếp theo
                    var lastEvent = await _context.EmployeeEvents
                        .Where(e => e.AggregateID == entity.EmployeeID)
                        .OrderByDescending(e => e.SequenceNumber)
                        .FirstOrDefaultAsync();
                    
                    int nextSequence = (lastEvent?.SequenceNumber ?? 0) + 1;

                    var newEvent = new EmployeeEvent
                    {
                        AggregateID = entity.EmployeeID,
                        EventType = eventType,
                        EventData = JsonSerializer.Serialize(changes),
                        SequenceNumber = nextSequence,
                        EventVersion = 1, // Default schema version
                        CreatedBy = performedBy,
                        CreatedAt = DateTime.Now
                    };

                    _context.EmployeeEvents.Add(newEvent);
                }

                return await _context.SaveChangesAsync();
            }

            // Nếu không phải Add hay Modified thì save bình thường
            return await _context.SaveChangesAsync();
        }
    }
}