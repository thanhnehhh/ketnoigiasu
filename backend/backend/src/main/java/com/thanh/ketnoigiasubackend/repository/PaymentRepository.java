package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.Payment;
import com.thanh.ketnoigiasubackend.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Payment> findByStatus(PaymentStatus status);

    boolean existsByUserIdAndPaymentTypeAndStatus(Long userId, String paymentType, PaymentStatus status);

    boolean existsByCourseIdAndPaymentTypeAndStatus(Long courseId, String paymentType, PaymentStatus status);

    // Lấy lịch sử học phí học viên đã trả cho các khóa học của gia sư
    @Query("SELECT p FROM Payment p WHERE p.paymentType = 'TUITION_FEE' AND p.status = 'SUCCESS' AND p.registration.course.tutor.id = :tutorProfileId ORDER BY p.verifiedAt DESC")
    List<Payment> findTuitionFeesByTutorProfileId(@Param("tutorProfileId") Long tutorProfileId);

    // Tổng doanh thu dự kiến = tổng học phí của học viên ACTIVE + COMPLETED
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentType = 'TUITION_FEE' AND p.status = 'SUCCESS' AND p.registration.course.tutor.id = :tutorProfileId")
    Double sumTuitionFeeByTutorProfileId(@Param("tutorProfileId") Long tutorProfileId);

    // Lấy học phí đã xác nhận nhưng chưa chuyển tiền cho gia sư
    @Query("SELECT p FROM Payment p WHERE p.paymentType = 'TUITION_FEE' AND p.status = 'SUCCESS' AND p.transferredToTutor = false ORDER BY p.verifiedAt ASC")
    List<Payment> findPendingTransferToTutor();
}
