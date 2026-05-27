package com.thanh.ketnoigiasubackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private String userFullName;
    private String email;
    private Double amount;
    private String paymentType;
    private String status;
    private String proofImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime expiresAt;
    private Long courseId;
    private String courseTitle;
    private Long registrationId;
    // Thông tin ngân hàng gia sư — hiển thị cho học viên khi cần nộp học phí
    private String tutorBankName;
    private String tutorBankAccount;
    private String tutorBankOwner;
    private boolean transferredToTutor;
    private LocalDateTime transferredAt;
    private String transferProofUrl;
}