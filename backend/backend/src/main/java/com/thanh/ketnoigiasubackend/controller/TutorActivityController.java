package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.SessionRequest;
import com.thanh.ketnoigiasubackend.entity.Course;
import com.thanh.ketnoigiasubackend.repository.CourseRepository;
import com.thanh.ketnoigiasubackend.service.NotificationService;
import com.thanh.ketnoigiasubackend.service.ReportToParentService;
import com.thanh.ketnoigiasubackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tutor/activities")
@RequiredArgsConstructor
public class TutorActivityController {
    private final SessionService sessionService;
    private final NotificationService notificationService;
    private final CourseRepository courseRepository;
    private final ReportToParentService reportToParentService;

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

    // 4. Đăng thông báo cho học viên (lớp 1-1 nên chỉ có 1 học viên)
    @PostMapping("/announcement")
    public ResponseEntity<?> postAnnouncement(@RequestParam Long courseId, @RequestBody String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));

        if (course.getRegistrations() != null) {
            course.getRegistrations().stream()
                .filter(reg -> "ACTIVE".equals(reg.getStatus()))
                .forEach(reg ->
                    notificationService.createNotification(reg.getStudent().getUser(), content));
        }
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

    // 6. Lấy danh sách học viên ACTIVE của lớp (để tutor chọn gửi báo cáo)
    @GetMapping("/course/{courseId}/students")
    public ResponseEntity<?> getActiveStudents(@PathVariable Long courseId, Authentication auth) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));
        // Kiểm tra quyền
        if (!course.getTutor().getUser().getEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).body("Bạn không có quyền xem lớp này");
        }
        var students = course.getRegistrations() == null ? java.util.List.of() :
                course.getRegistrations().stream()
                        .filter(r -> "ACTIVE".equals(r.getStatus()))
                        .map(r -> java.util.Map.of(
                                "registrationId", r.getId(),
                                "studentName", r.getStudent().getUser().getFullName(),
                                "studentEmail", r.getStudent().getUser().getEmail()
                        ))
                        .toList();
        return ResponseEntity.ok(students);
    }
}