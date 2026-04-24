package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.TutorProfileResponse;
import com.thanh.ketnoigiasubackend.service.TutorProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tutor-profiles")
@RequiredArgsConstructor
public class TutorProfileController {

    private final TutorProfileService tutorProfileService;

    // API để Student (hoặc khách) xem profile gia sư
    @GetMapping("/{id}")
    public ResponseEntity<TutorProfileResponse> getTutorProfile(@PathVariable Long id) {
        return ResponseEntity.ok(tutorProfileService.getPublicProfile(id));
    }
}