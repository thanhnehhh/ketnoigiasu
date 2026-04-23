package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.entity.CourseRegistration;
import com.thanh.ketnoigiasubackend.service.CourseRegistrationService;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tutor/registrations")
@RequiredArgsConstructor
public class TutorRegistrationController {

    private final CourseRegistrationService registrationService;
    private final UserRepository userRepository;

    // 1. Tutor xem tất cả các đơn đăng ký vào các khóa học của mình
    @GetMapping
    public ResponseEntity<List<CourseRegistration>> getMyApplications(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Gọi hàm tìm theo Tutor ID (User ID)
        return ResponseEntity.ok(registrationService.getApplicationsForTutor(user.getId()));
    }

    // 2. Tutor Duyệt hoặc Từ chối một đơn đăng ký cụ thể
    @PutMapping("/{id}/status")
    public ResponseEntity<?> reviewApplication(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication auth) {
        return ResponseEntity.ok(registrationService.updateStatus(id, status, auth.getName()));
    }
}