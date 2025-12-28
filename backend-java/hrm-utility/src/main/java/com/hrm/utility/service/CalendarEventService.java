package com.hrm.utility.service;

import com.hrm.utility.entity.CalendarEvent;
import com.hrm.utility.entity.Holiday;
import com.hrm.utility.repository.CalendarEventRepository;
import com.hrm.utility.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final HolidayRepository holidayRepository;

    public List<CalendarEvent> getEventsForUser(Long userId) {
        List<CalendarEvent> events = calendarEventRepository.findRelevantEvents(userId, CalendarEvent.EventType.HOLIDAY);
        List<Holiday> holidays = holidayRepository.findAll();

        List<CalendarEvent> allEvents = new ArrayList<>(events);
        
        // Map holidays to CalendarEvent for unified UI display
        int currentYear = java.time.LocalDate.now().getYear();
        holidays.forEach(h -> {
            if (h.isRecurring()) {
                // Show in previous, current and next year for navigation
                for (int year = currentYear - 1; year <= currentYear + 1; year++) {
                    allEvents.add(CalendarEvent.builder()
                            .eventID(h.getHolidayID() + 100000 + (year * 100))
                            .title(h.getName())
                            .description(h.getDescription())
                            .startTime(h.getHolidayDate().withYear(year).atStartOfDay())
                            .endTime(h.getHolidayDate().withYear(year).atTime(23, 59, 59))
                            .eventType(CalendarEvent.EventType.HOLIDAY)
                            .color("#ef4444")
                            .build());
                }
            } else {
                allEvents.add(CalendarEvent.builder()
                        .eventID(h.getHolidayID() + 100000)
                        .title(h.getName())
                        .description(h.getDescription())
                        .startTime(h.getHolidayDate().atStartOfDay())
                        .endTime(h.getHolidayDate().atTime(23, 59, 59))
                        .eventType(CalendarEvent.EventType.HOLIDAY)
                        .color("#ef4444")
                        .build());
            }
        });

        return allEvents;
    }

    public CalendarEvent saveEvent(CalendarEvent event) {
        if (event.getEventType() == CalendarEvent.EventType.PERSONAL) {
            event.setColor("#3b82f6"); // Blue for personal
        } else if (event.getEventType() == CalendarEvent.EventType.DEADLINE) {
            event.setColor("#f97316"); // Orange for deadlines
        }
        return calendarEventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        calendarEventRepository.deleteById(id);
    }
}
