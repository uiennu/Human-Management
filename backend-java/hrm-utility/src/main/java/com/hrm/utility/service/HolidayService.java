package com.hrm.utility.service;

import com.hrm.utility.entity.Holiday;
import com.hrm.utility.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public interface HolidayService {
    List<Holiday> getAllHolidays();
    Holiday createHoliday(Holiday holiday);
    List<Holiday> getHolidaysInRange(LocalDate startDate, LocalDate endDate);
    void deleteHoliday(Long id);
}

@Service
@RequiredArgsConstructor
class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository holidayRepository;

    @Override
    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    @Override
    public Holiday createHoliday(Holiday holiday) {
        return holidayRepository.save(holiday);
    }

    @Override
    public List<Holiday> getHolidaysInRange(LocalDate startDate, LocalDate endDate) {
        // More robust logic for recurring holidays
        List<Holiday> allHolidays = holidayRepository.findAll();
        
        return allHolidays.stream()
            .filter(h -> {
                if (!h.isRecurring()) {
                    return !h.getHolidayDate().isBefore(startDate) && !h.getHolidayDate().isAfter(endDate);
                } else {
                    // For recurring, we check month/day
                    // This is a simplified check for ranges within the same year or spanning two years
                    LocalDate currentYearDate = h.getHolidayDate().withYear(startDate.getYear());
                    LocalDate nextYearDate = h.getHolidayDate().withYear(startDate.getYear() + 1);
                    
                    return (!currentYearDate.isBefore(startDate) && !currentYearDate.isAfter(endDate)) ||
                           (!nextYearDate.isBefore(startDate) && !nextYearDate.isAfter(endDate));
                }
            })
            .collect(Collectors.toList());
    }

    @Override
    public void deleteHoliday(Long id) {
        holidayRepository.deleteById(id);
    }
}
