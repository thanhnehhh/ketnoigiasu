package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.SessionRequest;
import com.thanh.ketnoigiasubackend.entity.Course;
import com.thanh.ketnoigiasubackend.repository.CourseRegistrationRepository;
import com.thanh.ketnoigiasubackend.repository.CourseRepository;
import com.thanh.ketnoigiasubackend.service.EmailService;
import com.thanh.ketnoigiasubackend.service.NotificationService;
import com.thanh.ketnoigiasubackend.service.ReportToParentService;
import com.thanh.ketnoigiasubackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tutor/activities")
@RequiredArgsConstructor
public class TutorActivityController {
    private final SessionService sessionService;
    private final NotificationService notificationService;
    private final CourseRepository courseRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final ReportToParentService reportToParentService;
    private final EmailService emailService;

    // 1. Cập nhật lịch học (Online/Offline) vào buổi học có sẵn - Có bắn thông báo
    @PutMapping("/session/{id}/schedule")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody SessionRequest request) {
        return ResponseEntity.ok(sessionService.updateSessionSchedule(id, request));
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

    // 4. Đăng thông báo cho học viên
    @PostMapping("/announcement")
    @Transactional
    public ResponseEntity<?> postAnnouncement(@RequestParam Long courseId, @RequestBody String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));

        // Dùng registrationRepository thay vì lazy load course.getRegistrations()
        registrationRepository.findByCourseId(courseId).stream()
            .filter(reg -> "ACTIVE".equals(reg.getStatus()) || "COMPLETED".equals(reg.getStatus()))
            .forEach(reg -> {
                // Push notification trong app
                notificationService.createNotification(reg.getStudent().getUser(), content);
                // Gửi email đến học viên
                emailService.sendAnnouncementEmail(
                    reg.getStudent().getUser().getEmail(),
                    reg.getStudent().getUser().getFullName(),
                    course.getTitle(),
                    content
                );
            });

        return ResponseEntity.ok("Đã gửi thông báo cho học viên.");
    }

    @PutMapping("/session/{id}/edit-log")
    public ResponseEntity<?> editLog(@PathVariable Long id, @RequestBody String notes) {
        return ResponseEntity.ok(sessionService.editSessionLog(id, notes));
    }

    // 5. Gửi báo cáo học tập cho phụ huynh qua email
    // Body: { "registrationId": 1, "extraNote": "Con học rất chăm chỉ..." }
    @PostMapping("/report-to-parent")
    public ResponseEntity<?> sendReportToParent(
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Long registrationId = Long.valueOf(body.get("registrationId").toString());
        String extraNote = body.getOrDefault("extraNote", "").toString();
        reportToParentService.sendReportToParent(registrationId, auth.getName(), extraNote);
        return ResponseEntity.ok("Đã gửi báo cáo học tập cho phụ huynh thành công!");
    }

    // 6. Lấy danh sách học viên của lớp (ACTIVE + COMPLETED)
    @GetMapping("/course/{courseId}/students")
    @Transactional
    public ResponseEntity<?> getActiveStudents(@PathVariable Long courseId, Authentication auth) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));
        if (!course.getTutor().getUser().getEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).body("Bạn không có quyền xem lớp này");
        }
        // Dùng registrationRepository thay vì lazy load course.getRegistrations()
        var students = registrationRepository.findByCourseId(courseId).stream()
                .filter(r -> "ACTIVE".equals(r.getStatus()) || "COMPLETED".equals(r.getStatus()))
                .map(r -> java.util.Map.of(
                        "registrationId", r.getId(),
                        "studentName",    r.getStudent().getUser().getFullName(),
                        "studentEmail",   r.getStudent().getUser().getEmail()
                ))
                .toList();
        return ResponseEntity.ok(students);
    }
}