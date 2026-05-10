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
    private final CourseRegistrationRepository registrationRepository;
    private final NotificationService notificationService;

    @Transactional
    public PaymentResponse createPlatformFeeRequest(String email, String proofUrl) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (paymentRepository.existsByUserIdAndPaymentTypeAndStatus(user.getId(), "PLATFORM_FEE", PaymentStatus.PENDING_VERIFY))
            throw new RuntimeException("Bạn đã có yêu cầu phí sàn đang chờ duyệt.");
        if (hasPaidPlatformFee(user.getId()))
            throw new RuntimeException("Bạn đã thanh toán phí sàn thành công rồi.");

        Payment payment = Payment.builder().user(user).amount(200000.0)
                .paymentType("PLATFORM_FEE").proofImageUrl(proofUrl).status(PaymentStatus.PENDING_VERIFY).build();
        Payment saved = paymentRepository.save(payment);
        notificationService.createNotification(user,
                "💵 Yêu cầu phí sàn đã gửi. Vui lòng đợi Admin duyệt.", "/tutor");
        return mapToResponse(saved);
    }

    @Transactional
    public PaymentResponse createPromotionRequest(Long courseId, String email) {
        Course course = courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        if (!course.getTutor().getUser().getId().equals(user.getId()))
            throw new RuntimeException("Bạn không có quyền đẩy tin khóa học này");
        if (paymentRepository.existsByCourseIdAndPaymentTypeAndStatus(courseId, "PROMOTE", PaymentStatus.PENDING_VERIFY))
            throw new RuntimeException("Khóa học này đang có yêu cầu đẩy tin chờ duyệt.");

        Payment payment = Payment.builder().user(user).course(course).amount(50000.0)
                .paymentType("PROMOTE").status(PaymentStatus.PENDING).build();
        Payment saved = paymentRepository.save(payment);
        notificationService.createNotification(user,
                "🔥 Yêu cầu đẩy tin cho '" + course.getTitle() + "' đã tạo. Nộp minh chứng 50.000đ (Mã HĐ: #" + saved.getId() + ").",
                "/tutor");
        return mapToResponse(saved);
    }

    public List<PaymentResponse> getAllPendingPayments() {
        return paymentRepository.findByStatus(PaymentStatus.PENDING_VERIFY).stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public PaymentResponse approvePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
        if (payment.getStatus() == PaymentStatus.SUCCESS) throw new RuntimeException("Giao dịch này đã được duyệt rồi");

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setVerifiedAt(LocalDateTime.now());

        if ("PLATFORM_FEE".equals(payment.getPaymentType())) {
            notificationService.createNotification(payment.getUser(),
                    "✅ Phí sàn đã được duyệt! Bạn có thể tạo khóa học ngay.", "/tutor");

        } else if ("PROMOTE".equals(payment.getPaymentType()) && payment.getCourse() != null) {
            Course course = payment.getCourse();
            course.setPromoted(true);
            course.setPromotionExpiration(LocalDateTime.now().plusDays(7));
            courseRepository.save(course);
            notificationService.createNotification(payment.getUser(),
                    "🔥 Khóa học '" + course.getTitle() + "' đã được đẩy tin trong 7 ngày!", "/tutor");

        } else if ("TUITION_FEE".equals(payment.getPaymentType()) && payment.getRegistration() != null) {
            CourseRegistration reg = payment.getRegistration();
            reg.setStatus("ACTIVE");
            registrationRepository.save(reg);
            // Thông báo học viên → link đến lớp học
            notificationService.createNotification(payment.getUser(),
                    "✅ Học phí đã xác nhận! Lớp '" + reg.getCourse().getTitle() + "' đã bắt đầu. Chúc bạn học tốt!",
                    "/student/course/" + reg.getCourse().getId());
            // Thông báo gia sư → link đến quản lý lớp
            notificationService.createNotification(reg.getCourse().getTutor().getUser(),
                    "💰 " + reg.getStudent().getUser().getFullName() + " đã thanh toán học phí lớp '" + reg.getCourse().getTitle() + "'.",
                    "/tutor/course/" + reg.getCourse().getId());
        }

        return mapToResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse submitProof(Long paymentId, String proofImageUrl, String email) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn!"));
        if (payment.getExpiresAt() != null && LocalDateTime.now().isAfter(payment.getExpiresAt())) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Hóa đơn này đã quá hạn 24 giờ. Vui lòng đăng ký lại khóa học!");
        }
        if (!payment.getUser().getEmail().equals(email))
            throw new RuntimeException("Bạn không có quyền cập nhật hóa đơn này!");
        payment.setProofImageUrl(proofImageUrl);
        payment.setStatus(PaymentStatus.PENDING_VERIFY);
        return mapToResponse(paymentRepository.save(payment));
    }

    public List<PaymentResponse> getMyPayments(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::mapToResponse).toList();
    }

    public boolean hasPaidPlatformFee(Long userId) {
        return paymentRepository.existsByUserIdAndPaymentTypeAndStatus(userId, "PLATFORM_FEE", PaymentStatus.SUCCESS);
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId()).userFullName(payment.getUser().getFullName()).email(payment.getUser().getEmail())
                .amount(payment.getAmount()).paymentType(payment.getPaymentType()).status(payment.getStatus().name())
                .proofImageUrl(payment.getProofImageUrl()).createdAt(payment.getCreatedAt())
                .verifiedAt(payment.getVerifiedAt()).expiresAt(payment.getExpiresAt())
                .courseId(payment.getCourse() != null ? payment.getCourse().getId() : null)
                .courseTitle(payment.getCourse() != null ? payment.getCourse().getTitle() : null)
                .registrationId(payment.getRegistration() != null ? payment.getRegistration().getId() : null)
                .build();
    }
}
