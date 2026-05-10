package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.Payment;
import com.thanh.ketnoigiasubackend.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Payment> findByStatus(PaymentStatus status);

    boolean existsByUserIdAndPaymentTypeAndStatus(Long userId, String paymentType, PaymentStatus status);

    // Kiểm tra khóa học đang có promote đang chờ duyệt không
    boolean existsByCourseIdAndPaymentTypeAndStatus(Long courseId, String paymentType, PaymentStatus status);
}
