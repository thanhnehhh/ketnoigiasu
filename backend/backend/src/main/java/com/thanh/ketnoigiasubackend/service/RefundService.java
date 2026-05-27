package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.RefundRequestResponse;
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
public class RefundService {

    private final RefundRequestRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CourseRegistrationRepository registrationRepository;

    @Transactional
    public RefundRequestResponse createRefundRequest(String studentEmail, Long paymentId,
                                                      String reason, String evidenceUrl) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));

        // Kiểm tra quyền
        if (!payment.getUser().getId().equals(student.getId()))
            throw new RuntimeException("Bạn không có quyền yêu cầu hoàn tiền hóa đơn này");

        // Chỉ hoàn tiền khi đã thanh toán thành công
        if (payment.getStatus() != PaymentStatus.SUCCESS)
            throw new RuntimeException("Chỉ có thể yêu cầu hoàn tiền cho hóa đơn đã thanh toán thành công");

        // Không cho gửi 2 lần
        if (refundRepository.existsByPaymentIdAndStatus(paymentId, "PENDING"))
            throw new RuntimeException("Bạn đã có yêu cầu hoàn tiền đang chờ xử lý cho hóa đơn này");

        RefundRequest refund = RefundRequest.builder()
                .payment(payment)
                .student(student)
                .reason(reason)
                .evidenceUrl(evidenceUrl)
                .status("PENDING")
                .build();

        RefundRequest saved = refundRepository.save(refund);

        // Thông báo cho học viên
        notificationService.createNotification(student,
                "📋 Yêu cầu hoàn tiền #" + saved.getId() + " đã được gửi. Admin sẽ xem xét trong 3-5 ngày làm việc.",
                "/student");

        return mapToResponse(saved);
    }

    /** Học viên xem lịch sử yêu cầu hoàn tiền của mình */
    @Transactional(readOnly = true)
    public List<RefundRequestResponse> getMyRefundRequests(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return refundRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream().map(this::mapToResponse).toList();
    }

    /** Admin xem tất cả yêu cầu hoàn tiền đang chờ */
    @Transactional(readOnly = true)
    public List<RefundRequestResponse> getPendingRefunds() {
        return refundRepository.findByStatusOrderByCreatedAtDesc("PENDING")
                .stream().map(this::mapToResponse).toList();
    }

    /** Admin duyệt / từ chối yêu cầu hoàn tiền */
    @Transactional
    public RefundRequestResponse resolveRefund(Long refundId, String action, String adminNote) {
        RefundRequest refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu hoàn tiền"));

        if (!"PENDING".equals(refund.getStatus()))
            throw new RuntimeException("Yêu cầu này đã được xử lý rồi");

        refund.setStatus("APPROVED".equalsIgnoreCase(action) ? "APPROVED" : "REJECTED");
        refund.setAdminNote(adminNote);
        refund.setResolvedAt(LocalDateTime.now());

        if ("APPROVED".equalsIgnoreCase(action)) {
            // Thu hồi quyền truy cập lớp học — đặt registration về REFUNDED
            if (refund.getPayment() != null && refund.getPayment().getRegistration() != null) {
                CourseRegistration reg = refund.getPayment().getRegistration();
                reg.setStatus("REFUNDED");
                registrationRepository.save(reg);
            }
            notificationService.createNotification(refund.getStudent(),
                    "✅ Yêu cầu hoàn tiền #" + refundId + " đã được duyệt! Tiền sẽ được chuyển về trong 3-5 ngày làm việc. Quyền truy cập lớp học đã bị thu hồi.",
                    "/student");
        } else {
            notificationService.createNotification(refund.getStudent(),
                    "❌ Yêu cầu hoàn tiền #" + refundId + " bị từ chối. Lý do: " + adminNote,
                    "/student");
        }

        return mapToResponse(refundRepository.save(refund));
    }

    private RefundRequestResponse mapToResponse(RefundRequest r) {
        String courseTitle = null;
        Double amount = null;
        if (r.getPayment() != null) {
            amount = r.getPayment().getAmount();
            if (r.getPayment().getCourse() != null)
                courseTitle = r.getPayment().getCourse().getTitle();
            else if (r.getPayment().getRegistration() != null)
                courseTitle = r.getPayment().getRegistration().getCourse().getTitle();
        }
        return RefundRequestResponse.builder()
                .id(r.getId())
                .paymentId(r.getPayment() != null ? r.getPayment().getId() : null)
                .courseTitle(courseTitle)
                .amount(amount)
                .studentName(r.getStudent().getFullName())
                .reason(r.getReason())
                .evidenceUrl(r.getEvidenceUrl())
                .status(r.getStatus())
                .adminNote(r.getAdminNote())
                .createdAt(r.getCreatedAt())
                .resolvedAt(r.getResolvedAt())
                .build();
    }
}
