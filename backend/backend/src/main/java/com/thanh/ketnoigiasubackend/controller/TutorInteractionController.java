package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.ReplyRequest;
import com.thanh.ketnoigiasubackend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tutor/reviews")
@RequiredArgsConstructor
public class TutorInteractionController {

    private final ReviewService reviewService;

    @GetMapping("/my-reviews")
    public ResponseEntity<?> getMyReviews(Authentication auth) {
        return ResponseEntity.ok(reviewService.getReviewsForTutorByEmail(auth.getName()));
    }
    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyToReview(
            @PathVariable Long reviewId,
            @RequestBody ReplyRequest request,
            Authentication auth) {
        return ResponseEntity.ok(reviewService.replyToReview(reviewId, auth.getName(), request));
    }

}