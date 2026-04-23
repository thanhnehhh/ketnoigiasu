package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.entity.Course;
import com.thanh.ketnoigiasubackend.entity.Payment;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.enums.PaymentStatus;
import com.thanh.ketnoigiasubackend.repository.CourseRepository;
import com.thanh.ketnoigiasubackend.repository.PaymentRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Transactional
    public Payment createPromotionRequest(Long courseId, String email) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        // Kiểm tra quyền sở hữu khóa học
        if (!course.getTutor().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Bạn không có quyền quảng bá khóa học này");
        }

        return paymentRepository.save(Payment.builder()
                .user(user)
                .course(course)
                .amount(50000.0)
                .paymentType("PROMOTE") // Khớp với trường trong Entity Payment
                .status(PaymentStatus.PENDING_VERIFY)
                .build());
    }

    @Transactional
    public Payment approvePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new RuntimeException("Giao dịch này đã được duyệt");
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setVerifiedAt(LocalDateTime.now());

        if (payment.getCourse() != null) {
            Course course = payment.getCourse();
            course.setPromoted(true);
            course.setPromotionExpiration(LocalDateTime.now().plusDays(7));
            courseRepository.save(course);
        }

        return paymentRepository.save(payment);
    }
}