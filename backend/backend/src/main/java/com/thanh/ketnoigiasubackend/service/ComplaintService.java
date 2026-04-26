package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.ComplaintRequest;
import com.thanh.ketnoigiasubackend.dto.response.ComplaintResponse;
import com.thanh.ketnoigiasubackend.entity.Complaint;
import com.thanh.ketnoigiasubackend.entity.Review;
import com.thanh.ketnoigiasubackend.repository.ComplaintRepository;
import com.thanh.ketnoigiasubackend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ReviewRepository reviewRepository;

    @Transactional
    public ComplaintResponse submitComplaint(String tutorEmail, ComplaintRequest request) {
        Review review = reviewRepository.findById(request.getReviewId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));

        if (!review.getTutor().getUser().getEmail().equals(tutorEmail)) {
            throw new RuntimeException("Bạn không có quyền khiếu nại đánh giá này");
        }

        Complaint complaint = Complaint.builder()
                .review(review)
                .tutor(review.getTutor())
                .reason(request.getReason())
                .status("PENDING")
                .build();

        Complaint saved = complaintRepository.save(complaint);

        return ComplaintResponse.builder()
                .id(saved.getId())
                .reviewId(saved.getReview().getId())
                .tutorName(saved.getTutor().getUser().getFullName())
                .reason(saved.getReason())
                .status(saved.getStatus())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}