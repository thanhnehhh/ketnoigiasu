package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.StudentProfileRequest;
import com.thanh.ketnoigiasubackend.dto.request.TutorProfileRequest;
import com.thanh.ketnoigiasubackend.entity.StudentProfile;
import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<Object> getMyProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Chưa đăng nhập nè!");
        }
        String email = authentication.getName();
        return ResponseEntity.ok(profileService.getProfileByEmail(email));
    }

    @PutMapping("/student")
    public ResponseEntity<?> updateStudent(@RequestBody StudentProfileRequest request, Authentication auth) {
        return ResponseEntity.ok(profileService.updateStudentProfile(auth.getName(), request));
    }

    @PutMapping("/tutor")
    public ResponseEntity<?> updateTutor(@RequestBody TutorProfileRequest request, Authentication auth) {
        return ResponseEntity.ok(profileService.updateTutorProfile(auth.getName(), request));
    }
}