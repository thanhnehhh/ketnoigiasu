package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.CourseRequest;
import com.thanh.ketnoigiasubackend.service.CourseService;
import com.thanh.ketnoigiasubackend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<?> createCourse(@RequestBody CourseRequest request, Authentication auth) {
        return ResponseEntity.ok(courseService.createCourse(auth.getName(), request));
    }

    @PutMapping("/{id}/promote")
    public ResponseEntity<?> requestPromote(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(paymentService.createPromotionRequest(id, auth.getName()));
    }
    @GetMapping("/my-courses")
    public ResponseEntity<?> getMyCourses(Authentication auth) {
        // auth.getName() chính là email của ông đã được Filter nạp vào
        return ResponseEntity.ok(courseService.getCoursesByTutorEmail(auth.getName()));
    }
}