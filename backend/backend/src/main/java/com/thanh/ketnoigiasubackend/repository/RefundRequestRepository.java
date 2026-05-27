package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {
    List<RefundRequest> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    boolean existsByPaymentIdAndStatus(Long paymentId, String status);
    List<RefundRequest> findByStatusOrderByCreatedAtDesc(String status);
}
