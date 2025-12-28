using System.Text.Json;

namespace HRM.Api.Services
{
    public interface ICalendarServiceClient
    {
        Task<List<HolidayResponse>> GetHolidaysInRangeAsync(DateTime start, DateTime end);
    }

    public class HolidayResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime HolidayDate { get; set; }
        public bool Recurring { get; set; }
    }

    public class CalendarServiceClient : ICalendarServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl = "http://localhost:8081/api";

        public CalendarServiceClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<HolidayResponse>> GetHolidaysInRangeAsync(DateTime start, DateTime end)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/holidays/check?start={start:yyyy-MM-dd}&end={end:yyyy-MM-dd}");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return JsonSerializer.Deserialize<List<HolidayResponse>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<HolidayResponse>();
                }
            }
            catch (Exception ex)
            {
                // Log error or handle gracefully
                Console.WriteLine($"Error calling Holiday Service: {ex.Message}");
            }
            return new List<HolidayResponse>();
        }
    }
}
