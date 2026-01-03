package com.hrm.utility.controller;

import com.hrm.utility.entity.LeaveRequestResponseDto;
import com.hrm.utility.service.LeaveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    @Autowired
    private LeaveService leaveService;

    // API: GET http://localhost:8081/api/approvals/pending?managerId=2
    @GetMapping("/pending")
    public ResponseEntity<List<LeaveRequestResponseDto>> getPendingRequests(
            @RequestParam Integer managerId) {
            
        // Lưu ý: Trong thực tế, managerId nên lấy từ JWT Token để bảo mật
        List<LeaveRequestResponseDto> result = leaveService.getPendingApprovals(managerId);
        return ResponseEntity.ok(result);
    }
}