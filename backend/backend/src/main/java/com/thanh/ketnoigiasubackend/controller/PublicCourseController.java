package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/courses")
@RequiredArgsConstructor
public class PublicCourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String teachingMode,
            @RequestParam(required = false) String province) {
        return ResponseEntity.ok(courseService.searchCourses(q, subject, minPrice, maxPrice, grade, teachingMode, province));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }
}
