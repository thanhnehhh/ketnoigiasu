package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.SessionRequest;
import com.thanh.ketnoigiasubackend.entity.Course;
import com.thanh.ketnoigiasubackend.repository.CourseRepository;
import com.thanh.ketnoigiasubackend.service.NotificationService;
import com.thanh.ketnoigiasubackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tutor/activities")
@RequiredArgsConstructor
public class TutorActivityController {
    private final SessionService sessionService;
    private final NotificationService notificationService;
    private final CourseRepository courseRepository;

    // 1. Tạo buổi học (Online/Offline) - Có bắn thông báo
    @PostMapping("/session")
    public ResponseEntity<?> createSession(@RequestParam Long courseId, @RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.createSession(courseId, request));
    }

    // 2. Ghi nhật ký dạy học sau khi kết thúc buổi
    @PutMapping("/session/{id}/log")
    public ResponseEntity<?> writeLog(@PathVariable Long id, @RequestBody String notes) {
        return ResponseEntity.ok(sessionService.updateSessionLog(id, notes));
    }

    // 3. Xem lịch sử dạy học của lớp
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getHistory(@PathVariable Long courseId) {
        return ResponseEntity.ok(sessionService.getSessionsByCourse(courseId));
    }

    // 4. Đăng thông báo khẩn cho cả lớp (Ví dụ báo nghỉ học)
    @PostMapping("/announcement")
    public ResponseEntity<?> postAnnouncement(@RequestParam Long courseId, @RequestBody String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));

        if (course.getRegistrations() != null) {
            course.getRegistrations().forEach(reg ->
                    notificationService.createNotification(reg.getStudent().getUser(), content));
        }
        return ResponseEntity.ok("Đã gửi thông báo cho cả lớp.");
    }

    @PutMapping("/session/{id}/edit-log")
    public ResponseEntity<?> editLog(@PathVariable Long id, @RequestBody String notes) {
        return ResponseEntity.ok(sessionService.editSessionLog(id, notes));
    }
}