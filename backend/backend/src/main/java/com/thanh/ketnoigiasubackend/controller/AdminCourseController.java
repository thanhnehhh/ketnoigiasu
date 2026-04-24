package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.enums.CourseStatus;
import com.thanh.ketnoigiasubackend.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {
    private final CourseService courseService;

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
}