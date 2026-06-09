package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.enums.CourseStatus;
import com.thanh.ketnoigiasubackend.repository.SessionRepository;
import com.thanh.ketnoigiasubackend.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {
    private final CourseService courseService;
    private final SessionRepository sessionRepository;

    @GetMapping
    public ResponseEntity<?> getCourses(@RequestParam(required = false) CourseStatus status) {
        if (status != null) {
            return ResponseEntity.ok(courseService.getCoursesByStatusForAdmin(status));
        }
        return ResponseEntity.ok(courseService.getAllCoursesForAdmin());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.approveCourse(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.rejectCourse(id));
    }

    /** Tổng phí sàn của một khóa học theo từng buổi */
    @GetMapping("/{id}/fee-summary")
    public ResponseEntity<?> getFeeSummary(@PathVariable Long id) {
        var sessions = sessionRepository.findByCourseIdOrderBySessionOrderAsc(id);
        long onlineCount  = sessions.stream().filter(s -> "ONLINE".equals(s.getSessionMode())).count();
        long offlineCount = sessions.stream().filter(s -> "OFFLINE".equals(s.getSessionMode())).count();
        double totalFee   = sessions.stream()
                .filter(s -> s.getSessionFee() != null)
                .mapToDouble(s -> s.getSessionFee())
                .sum();
        return ResponseEntity.ok(Map.of(
                "totalSessions",  sessions.size(),
                "completedSessions", sessions.stream().filter(s -> s.isCompleted()).count(),
                "onlineCount",    onlineCount,
                "offlineCount",   offlineCount,
                "totalPlatformFee", Math.round(totalFee * 100.0) / 100.0
        ));
    }
}