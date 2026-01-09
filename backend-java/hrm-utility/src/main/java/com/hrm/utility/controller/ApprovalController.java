package com.hrm.utility.controller;

import com.hrm.utility.entity.LeaveRequestResponseDto;
import com.hrm.utility.service.LeaveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    @Autowired
    private LeaveService leaveService;

    // API: GET http://localhost:8081/api/approvals/pending?managerId=2
    @GetMapping("/pending")
    public ResponseEntity<List<LeaveRequestResponseDto>> getPendingRequests(
            @RequestParam Integer managerId,
            @RequestParam(required = false) Integer leaveTypeId) {

        // Lưu ý: Trong thực tế, managerId nên lấy từ JWT Token để bảo mật
        List<LeaveRequestResponseDto> result = leaveService.getPendingApprovals(managerId, leaveTypeId);
        return ResponseEntity.ok(result);
    }

    // API: GET http://localhost:8081/api/approvals/all?managerId=2
    @GetMapping("/all")
    public ResponseEntity<List<LeaveRequestResponseDto>> getAllRequests(
            @RequestParam Integer managerId,
            @RequestParam(required = false) Integer leaveTypeId) {

        // Lấy TẤT CẢ requests của manager (không phân biệt status)
        List<LeaveRequestResponseDto> result = leaveService.getAllApprovals(managerId, leaveTypeId);
        return ResponseEntity.ok(result);
    }

    // API: POST http://localhost:8081/api/approvals/{id}/approve
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, String>> approveRequest(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body) {

        String note = (body != null && body.containsKey("note")) ? body.get("note") : "";
        leaveService.approveRequest(id, note);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Request approved successfully");
        return ResponseEntity.ok(response);
    }

    // API: POST http://localhost:8081/api/approvals/{id}/reject
    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, String>> rejectRequest(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {

        String note = body.get("note");
        if (note == null || note.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Note is required for rejection");
            return ResponseEntity.badRequest().body(error);
        }

        leaveService.rejectRequest(id, note);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Request rejected successfully");
        return ResponseEntity.ok(response);
    }
}