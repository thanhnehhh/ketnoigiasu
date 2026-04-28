package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.PaymentResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.PaymentStatus;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // 1. Gia sư nộp phí sàn
    @Transactional
    public PaymentResponse createPlatformFeeRequest(String email, String proofUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = Payment.builder()
                .user(user)
                .amount(200000.0)
                .paymentType("PLATFORM_FEE")
                .proofImageUrl(proofUrl)
                .status(PaymentStatus.PENDING_VERIFY)
                .build();

        Payment saved = paymentRepository.save(payment);
        notificationService.createNotification(user, "Yêu cầu thanh toán phí sàn đã gửi. Vui lòng đợi Admin duyệt.");
        return mapToResponse(saved);
    }

    // 2. Gia sư yêu cầu đẩy tin
    @Transactional
    public PaymentResponse createPromotionRequest(Long courseId, String email) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (!course.getTutor().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền đẩy tin khóa học này");
        }

        Payment payment = Payment.builder()
                .user(user)
                .course(course)
                .amount(50000.0)
                .paymentType("PROMOTE")
                .status(PaymentStatus.PENDING_VERIFY)
                .build();

        Payment saved = paymentRepository.save(payment);
        notificationService.createNotification(user, "Yêu cầu đẩy tin cho khóa học '" + course.getTitle() + "' đang chờ duyệt.");
        return mapToResponse(saved);
    }

    // 3. Lấy danh sách chờ duyệt cho Admin
    public List<PaymentResponse> getAllPendingPayments() {
        return paymentRepository.findByStatus(PaymentStatus.PENDING_VERIFY)
                .stream().map(this::mapToResponse).toList();
    }

    // 4. Admin duyệt thanh toán
    @Transactional
    public PaymentResponse approvePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new RuntimeException("Giao dịch này đã được duyệt");
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setVerifiedAt(LocalDateTime.now());

        if ("PLATFORM_FEE".equals(payment.getPaymentType())) {
            notificationService.createNotification(payment.getUser(), "Phí sàn đã được duyệt! Bạn có thể tạo khóa học ngay.");
        } else if ("PROMOTE".equals(payment.getPaymentType()) && payment.getCourse() != null) {
            Course course = payment.getCourse();
            course.setPromoted(true);
            course.setPromotionExpiration(LocalDateTime.now().plusDays(7));
            courseRepository.save(course);
            notificationService.createNotification(payment.getUser(), "Khóa học '" + course.getTitle() + "' đã được đẩy tin!");
        }
        else if ("TUITION_FEE".equals(payment.getPaymentType())) {
            notificationService.createNotification(payment.getUser(), "Học phí của bạn đã được duyệt thành công! Chúc bạn học tốt.");
        }
        return mapToResponse(paymentRepository.save(payment));
    }

    // 5. Học viên nộp minh chứng chuyển khoản học phí
    @Transactional
    public PaymentResponse submitProof(Long paymentId, String proofImageUrl, String email) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn!"));

        if (payment.getExpiresAt() != null && LocalDateTime.now().isAfter(payment.getExpiresAt())) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Hóa đơn này đã quá hạn 24 giờ. Vui lòng đăng ký lại khóa học!");
        }

        if (!payment.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Bạn không có quyền cập nhật hóa đơn này!");
        }

        payment.setProofImageUrl(proofImageUrl);
        payment.setStatus(PaymentStatus.PENDING_VERIFY);

        return mapToResponse(paymentRepository.save(payment));
    }
    public boolean hasPaidPlatformFee(Long userId) {
        return paymentRepository.existsByUserIdAndPaymentTypeAndStatus(
                userId, "PLATFORM_FEE", PaymentStatus.SUCCESS);
    }

    // Mapper chuyển đổi Entity sang DTO sạch
    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .userFullName(payment.getUser().getFullName())
                .email(payment.getUser().getEmail())
                .amount(payment.getAmount())
                .paymentType(payment.getPaymentType())
                .status(payment.getStatus().name())
                .proofImageUrl(payment.getProofImageUrl())
                .createdAt(payment.getCreatedAt())
                .verifiedAt(payment.getVerifiedAt())
                .build();
    }
}