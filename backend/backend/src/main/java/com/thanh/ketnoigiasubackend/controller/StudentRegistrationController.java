package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.CourseRegistrationService;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/registrations")
@RequiredArgsConstructor
public class StudentRegistrationController {

    private final CourseRegistrationService registrationService;
    private final UserRepository userRepository;

    // Student xem danh sách đã đăng ký
    @GetMapping
    public ResponseEntity<?> getMyRegistrations(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(registrationService.getRegistrationsForStudent(user.getId()));
    }

    // Student thực hiện đăng ký (truyền courseId qua URL hoặc Body đều được)
    // Ở đây tui dùng RequestParam cho lẹ: ?courseId=1&notes=Em muon hoc
    @PostMapping
    public ResponseEntity<?> register(
            @RequestParam Long courseId,
            @RequestParam(required = false) String notes,
            Authentication auth) {
        return ResponseEntity.ok(registrationService.registerCourse(courseId, auth.getName(), notes));
    }
}