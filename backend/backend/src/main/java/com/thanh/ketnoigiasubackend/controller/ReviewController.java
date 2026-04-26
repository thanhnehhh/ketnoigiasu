package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.ReviewRequest;
import com.thanh.ketnoigiasubackend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewRequest request, Authentication auth) {
        return ResponseEntity.ok(reviewService.postReview(auth.getName(), request));
    }

    @GetMapping("/tutor/{tutorUserId}")
    public ResponseEntity<?> getTutorReviews(@PathVariable Long tutorUserId) {
        return ResponseEntity.ok(reviewService.getReviewsForTutor(tutorUserId));
    }
}