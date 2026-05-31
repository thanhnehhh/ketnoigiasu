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

    @GetMapping
    public ResponseEntity<?> getAllTutors(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String subject) {
        return ResponseEntity.ok(tutorProfileService.getAllTutors(keyword, subject));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TutorProfileResponse> getTutorProfile(@PathVariable Long id) {
        return ResponseEntity.ok(tutorProfileService.getPublicProfile(id));
    }
}