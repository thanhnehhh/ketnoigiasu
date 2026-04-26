package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.ReplyRequest;
import com.thanh.ketnoigiasubackend.dto.request.ReviewRequest;
import com.thanh.ketnoigiasubackend.dto.response.ReviewResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final NotificationService notificationService;
    @Transactional
    public ReviewResponse postReview(String email, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CourseRegistration reg = registrationRepository.findById(request.getRegistrationId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin đăng ký"));

        if (!reg.getStudent().getUser().getEmail().equals(email)) {
            throw new RuntimeException("Bạn không có quyền đánh giá");
        }

        if (!"COMPLETED".equals(reg.getStatus())) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá sau khi khóa học đã hoàn thành và được xác nhận!");
        }

        Review review = Review.builder()
                .registration(reg)
                .student(reg.getStudent())
                .tutor(reg.getCourse().getTutor())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);

        notificationService.createNotification(
                saved.getTutor().getUser(),
                "Học viên " + user.getFullName() + " đã đánh giá " + saved.getRating() + " sao cho lớp " + saved.getRegistration().getCourse().getTitle()
        );

        return mapToResponse(saved);
    }

    public List<ReviewResponse> getReviewsForTutor(Long tutorUserId) {
        return reviewRepository.findByTutorUserId(tutorUserId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .studentName(review.getStudent().getUser().getFullName())
                .courseTitle(review.getRegistration().getCourse().getTitle()) // Dùng getRegistration()
                .rating(review.getRating())
                .comment(review.getComment())
                .tutorReply(review.getTutorReply())
                .repliedAt(review.getRepliedAt())
                .createdAt(review.getCreatedAt())
                .build();
    }
    public List<ReviewResponse> getReviewsForTutorByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tutor not found"));

        return reviewRepository.findByTutorUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    @Transactional
    public ReviewResponse replyToReview(Long reviewId, String tutorEmail, ReplyRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));

        if (!review.getTutor().getUser().getEmail().equals(tutorEmail)) {
            throw new RuntimeException("Bạn không có quyền phản hồi đánh giá này!");
        }

        review.setTutorReply(request.getReplyComment());
        review.setRepliedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        notificationService.createNotification(
                saved.getStudent().getUser(),
                "Gia sư " + saved.getTutor().getUser().getFullName() + " đã phản hồi đánh giá của bạn."
        );
        return mapToResponse(saved);
    }
    public List<ReviewResponse> getReviewsByCourse(Long courseId) {
        return reviewRepository.findValidReviewsByCourseId(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}