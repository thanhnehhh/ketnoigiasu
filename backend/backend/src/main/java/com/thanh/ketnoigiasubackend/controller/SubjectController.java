package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.entity.Subject;
import com.thanh.ketnoigiasubackend.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectRepository subjectRepository;

    // Lấy tất cả môn học để FE dùng đúng tên khi filter
    @GetMapping
    public ResponseEntity<List<Subject>> getAll() {
        return ResponseEntity.ok(subjectRepository.findAll());
    }

    // Debug: xem tất cả khóa học và status của chúng (tạm thời để test)
    @GetMapping("/debug/courses")
    public ResponseEntity<?> debugCourses(
            @org.springframework.beans.factory.annotation.Autowired
            com.thanh.ketnoigiasubackend.repository.CourseRepository courseRepository) {
        return ResponseEntity.ok(courseRepository.findAll().stream()
                .map(c -> java.util.Map.of(
                        "id", c.getId(),
                        "title", c.getTitle(),
                        "status", c.getStatus().name(),
                        "subject", c.getSubject() != null ? c.getSubject().getName() : "null"
                )).toList());
    }

    // Admin tạo môn học mới nếu chưa có
    @PostMapping("/admin")
    public ResponseEntity<Subject> create(@RequestBody String name) {
        Subject subject = Subject.builder().name(name.trim()).build();
        return ResponseEntity.ok(subjectRepository.save(subject));
    }
}
