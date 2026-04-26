package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.*;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InteractionService {
    private final ReportRepository reportRepository;
    private final ComplaintRepository complaintRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    @Transactional
    public void sendReport(String email, ReportRequest request) {
        CourseRegistration reg = registrationRepository.findById(request.getRegistrationId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đăng ký"));

        Report report = Report.builder()
                .registration(reg)
                .student(reg.getStudent())
                .title(request.getTitle())
                .content(request.getContent())
                .build();
        reportRepository.save(report);
    }

    @Transactional
    public void submitComplaint(String email, ComplaintRequest request) {
        Review review = reviewRepository.findById(request.getReviewId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy review"));

        Complaint complaint = Complaint.builder()
                .review(review)
                .tutor(review.getTutor())
                .reason(request.getReason())
                .build();
        complaintRepository.save(complaint);
    }
}