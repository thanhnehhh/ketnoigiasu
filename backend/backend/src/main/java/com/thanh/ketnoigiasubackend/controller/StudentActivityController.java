package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.MaterialService;
import com.thanh.ketnoigiasubackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

}