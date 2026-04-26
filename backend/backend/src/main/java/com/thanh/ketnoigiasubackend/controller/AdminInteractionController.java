package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.AdminInteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/interactions")
@RequiredArgsConstructor
public class AdminInteractionController {
    private final AdminInteractionService adminService;

    @GetMapping("/reports")
    public ResponseEntity<?> getAllReports() {
        return ResponseEntity.ok(adminService.getAllReports());
    }

    @GetMapping("/complaints")
    public ResponseEntity<?> getAllComplaints() {
        return ResponseEntity.ok(adminService.getAllComplaints());
    }

    @PostMapping("/complaints/{id}/resolve")
    public ResponseEntity<?> resolveComplaint(@PathVariable Long id, @RequestParam boolean accept) {
        adminService.handleReviewComplaint(id, accept);
        return ResponseEntity.ok("Đã xử lý khiếu nại.");
    }

    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(@PathVariable Long id, @RequestParam String resolution) {
        adminService.resolveReport(id, resolution);
        return ResponseEntity.ok("Đã xử lý xong báo cáo vi phạm: " + resolution);
    }

    @GetMapping("/registrations/{id}/log")
    public ResponseEntity<?> getTrainingLog(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getTrainingLog(id));
    }

    @PostMapping("/registrations/{id}/cancel")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long id, @RequestParam String reason) {
        adminService.cancelRegistration(id, reason);
        return ResponseEntity.ok("Đã hủy lớp học và thông báo cho hai bên. Lý do: " + reason);
    }

    @PutMapping("/courses/{id}/hide")
    public ResponseEntity<?> hideCourse(@PathVariable Long id, @RequestParam String reason) {
        adminService.hideCourse(id, reason);
        return ResponseEntity.ok("Đã ẩn khóa học và gửi thông báo.");
    }
}