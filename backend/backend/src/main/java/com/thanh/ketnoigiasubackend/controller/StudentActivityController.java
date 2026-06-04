package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.MaterialService;
import com.thanh.ketnoigiasubackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student/activities")
@RequiredArgsConstructor
public class StudentActivityController {

    private final MaterialService materialService;
    private final SessionService sessionService;

    // 1. Tải tài liệu học tập (Xem danh sách tài liệu của lớp mình đang học)
    @GetMapping("/course/{courseId}/materials")
    public ResponseEntity<?> getMaterials(@PathVariable Long courseId) {
        return ResponseEntity.ok(materialService.getMaterialsByCourse(courseId));
    }

    // 2. Truy cập phòng trực tuyến & Xem nhật ký (Lấy danh sách buổi học)
    @GetMapping("/course/{courseId}/sessions")
    public ResponseEntity<?> getSessions(@PathVariable Long courseId) {
        return ResponseEntity.ok(sessionService.getSessionsByCourse(courseId));
    }

    // 3. Học viên gửi phản hồi cho buổi học đã hoàn thành
    @PutMapping("/session/{sessionId}/feedback")
    public ResponseEntity<?> submitFeedback(
            @PathVariable Long sessionId,
            @RequestBody String feedback,
            Authentication auth) {
        return ResponseEntity.ok(sessionService.submitStudentFeedback(sessionId, feedback, auth.getName()));
    }

    // 4. Học viên xác nhận đã học buổi này (sau khi gia sư ghi nhật ký)
    @PutMapping("/session/{sessionId}/confirm")
    public ResponseEntity<?> confirmSession(
            @PathVariable Long sessionId,
            Authentication auth) {
        return ResponseEntity.ok(sessionService.studentConfirmSession(sessionId, auth.getName()));
    }

    // 5. Học viên phản đối buổi học (nghi ngờ gia sư không dạy thực sự)
    // Body: { "reason": "Gia sư không vào phòng học đúng giờ..." }
    @PutMapping("/session/{sessionId}/dispute")
    public ResponseEntity<?> disputeSession(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String reason = body.getOrDefault("reason", "");
        return ResponseEntity.ok(sessionService.studentDisputeSession(sessionId, reason, auth.getName()));
    }
}