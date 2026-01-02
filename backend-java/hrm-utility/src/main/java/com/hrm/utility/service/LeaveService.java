package com.hrm.utility.service;

import com.hrm.utility.entity.LeaveRequestResponseDto;
import com.hrm.utility.entity.LeaveRequest;
import com.hrm.utility.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    public List<LeaveRequestResponseDto> getPendingApprovals(Integer managerId) {
        // 1. Lấy tất cả đơn có ManagerID trùng khớp và Status là 'Pending'
        List<LeaveRequest> requests = leaveRequestRepository.findByManagerIDAndStatus(managerId, "Pending");

        // 2. Convert Entity sang DTO
        return requests.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private LeaveRequestResponseDto mapToDto(LeaveRequest entity) {
        LeaveRequestResponseDto dto = new LeaveRequestResponseDto();
        dto.setLeaveRequestID(entity.getLeaveRequestID());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setTotalDays(entity.getTotalDays());
        dto.setStatus(entity.getStatus());
        dto.setRequestedDate(entity.getRequestedDate().toString());

        // Lấy thông tin từ bảng Employee (đã Join)
        if (entity.getEmployee() != null) {
            dto.setEmployeeName(entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName());
            dto.setAvatarUrl(entity.getEmployee().getAvatarUrl());
        }

        // Lấy thông tin từ bảng LeaveType (đã Join)
        if (entity.getLeaveType() != null) {
            dto.setLeaveTypeName(entity.getLeaveType().getName());
        }
        
        return dto;
    }
}