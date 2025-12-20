using HRM.Api.Data;
using HRM.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace HRM.Api.Services
{
    public interface IEventReplayService
    {
        Task<ReplayResultDto> ReplayEventsAsync(int employeeId, int? upToSequenceNumber = null);
        Task<Employee?> ReconstructEmployeeStateAsync(int employeeId, int? upToSequenceNumber = null);
    }

    public class EventReplayService : IEventReplayService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<EventReplayService> _logger;

        public EventReplayService(AppDbContext context, ILogger<EventReplayService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Replay tất cả events để tái tạo lại state của employee
        /// </summary>
        public async Task<ReplayResultDto> ReplayEventsAsync(int employeeId, int? upToSequenceNumber = null)
        {
            try
            {
                var employee = await ReconstructEmployeeStateAsync(employeeId, upToSequenceNumber);

                if (employee == null)
                {
                    return new ReplayResultDto
                    {
                        Success = false,
                        Message = "No events found for this employee"
                    };
                }

                return new ReplayResultDto
                {
                    Success = true,
                    Message = $"Successfully replayed events up to sequence {upToSequenceNumber?.ToString() ?? "latest"}",
                    ReconstructedEmployee = employee
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error replaying events for employee {employeeId}");
                return new ReplayResultDto
                {
                    Success = false,
                    Message = $"Error: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Tái tạo lại state của employee từ events
        /// </summary>
        public async Task<Employee?> ReconstructEmployeeStateAsync(int employeeId, int? upToSequenceNumber = null)
        {
            // Lấy tất cả events của employee này, sắp xếp theo SequenceNumber
            var query = _context.EmployeeEvents
                .Where(e => e.AggregateID == employeeId);

            if (upToSequenceNumber.HasValue)
            {
                query = query.Where(e => e.SequenceNumber <= upToSequenceNumber.Value);
            }

            var events = await query
                .OrderBy(e => e.SequenceNumber)
                .ToListAsync();

            if (!events.Any())
            {
                return null;
            }

            Employee? employee = null;

            foreach (var evt in events)
            {
                employee = ApplyEvent(employee, evt);
            }

            return employee;
        }

        /// <summary>
        /// Apply một event lên state hiện tại
        /// </summary>
        private Employee? ApplyEvent(Employee? currentState, EmployeeEvent evt)
        {
            switch (evt.EventType)
            {
                case "EmployeeCreated":
                case "EmployeeImported":
                    // Sự kiện tạo mới: Deserialize toàn bộ object
                    return DeserializeEmployee(evt.EventData, evt.EventVersion);

                case "ProfileUpdated":
                    // Sự kiện cập nhật: Apply các thay đổi
                    return ApplyProfileUpdate(currentState, evt.EventData, evt.EventVersion);

                case "EmergencyContactsUpdated":
                    return ApplyEmergencyContactsUpdate(currentState, evt.EventData, evt.EventVersion);

                case "SensitiveInfoUpdateRequested":
                    // Chỉ là request, chưa apply thay đổi thực sự
                    return currentState;

                default:
                    _logger.LogWarning($"Unknown event type: {evt.EventType}");
                    return currentState;
            }
        }

        /// <summary>
        /// Deserialize Employee từ JSON với version handling
        /// </summary>
        private Employee? DeserializeEmployee(string eventData, int eventVersion)
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            switch (eventVersion)
            {
                case 1:
                default:
                    // Version 1: Cấu trúc hiện tại
                    return JsonSerializer.Deserialize<Employee>(eventData, options);

                // Trong tương lai nếu có version 2, 3... xử lý ở đây
                // case 2:
                //     var v2Data = JsonSerializer.Deserialize<EmployeeV2>(eventData, options);
                //     return ConvertV2ToEmployee(v2Data);
            }
        }

        /// <summary>
        /// Apply ProfileUpdated event
        /// </summary>
        private Employee? ApplyProfileUpdate(Employee? employee, string eventData, int eventVersion)
        {
            if (employee == null) return null;

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var changes = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(eventData, options);

            if (changes == null) return employee;

            foreach (var change in changes)
            {
                if (change.Key == "UpdatedAt") continue; // Skip UpdatedAt

                try
                {
                    var changeData = change.Value;
                    
                    // Kiểm tra xem có phải là object {Old, New} không
                    if (changeData.ValueKind == JsonValueKind.Object && 
                        changeData.TryGetProperty("New", out var newValue))
                    {
                        ApplyPropertyChange(employee, change.Key, newValue);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"Could not apply change to {change.Key}: {ex.Message}");
                }
            }

            return employee;
        }

        /// <summary>
        /// Apply EmergencyContactsUpdated event
        /// </summary>
        private Employee? ApplyEmergencyContactsUpdate(Employee? employee, string eventData, int eventVersion)
        {
            if (employee == null) return null;

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var data = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(eventData, options);

            if (data != null && data.ContainsKey("New"))
            {
                var newContacts = JsonSerializer.Deserialize<List<EmergencyContactData>>(
                    data["New"].GetRawText(), options);

                employee.EmergencyContacts = newContacts?.Select(c => new EmployeeEmergencyContact
                {
                    Name = c.Name,
                    Phone = c.Phone,
                    Relation = c.Relation
                }).ToList() ?? new List<EmployeeEmergencyContact>();
            }

            return employee;
        }

        /// <summary>
        /// Apply single property change
        /// </summary>
        private void ApplyPropertyChange(Employee employee, string propertyName, JsonElement newValue)
        {
            switch (propertyName)
            {
                case "Phone":
                    employee.Phone = newValue.GetString();
                    break;
                case "Address":
                    employee.Address = newValue.GetString();
                    break;
                case "PersonalEmail":
                    employee.PersonalEmail = newValue.GetString();
                    break;
                case "BankAccountNumber":
                    employee.BankAccountNumber = newValue.GetString();
                    break;
                case "TaxID":
                    employee.TaxID = newValue.GetString();
                    break;
                case "AvatarUrl":
                    employee.AvatarUrl = newValue.GetString();
                    break;
                default:
                    _logger.LogWarning($"Unknown property: {propertyName}");
                    break;
            }
        }

        // Helper class for deserialization
        private class EmergencyContactData
        {
            public string Name { get; set; } = string.Empty;
            public string Phone { get; set; } = string.Empty;
            public string Relation { get; set; } = string.Empty;
        }
    }

    // DTOs
    public class ReplayResultDto
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        public Employee? ReconstructedEmployee { get; set; }
    }
}
