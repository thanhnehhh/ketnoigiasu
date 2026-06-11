package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.StudentProfileRequest;
import com.thanh.ketnoigiasubackend.dto.request.TutorProfileRequest;
import com.thanh.ketnoigiasubackend.entity.StudentProfile;
import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.service.ProfileService;
import com.thanh.ketnoigiasubackend.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping("/tutor/avatar")
    public ResponseEntity<?> uploadTutorAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        return ResponseEntity.ok(profileService.uploadTutorAvatar(auth.getName(), file));
    }

    @PostMapping("/tutor/qualification")
    public ResponseEntity<?> uploadQualification(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        return ResponseEntity.ok(profileService.uploadTutorQualification(auth.getName(), file));
    }

    /** Gia sư nộp hồ sơ xét duyệt: upload bằng cấp + ghi lời nhắn */
    @PostMapping("/tutor/submit-verification")
    public ResponseEntity<?> submitVerification(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "note", required = false) String note,
            Authentication auth) {
        return ResponseEntity.ok(profileService.submitVerification(auth.getName(), file, note));
    }
}