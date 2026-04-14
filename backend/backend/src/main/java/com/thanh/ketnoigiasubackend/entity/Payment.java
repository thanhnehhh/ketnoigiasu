package com.thanh.ketnoigiasubackend.entity;

import com.thanh.ketnoigiasubackend.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;                    // Người thanh toán (học viên)

    @ManyToOne
    @JoinColumn(name = "enrollment_id")
    private Enrollment enrollment;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String paymentType;           // "TUITION" hoặc "OTHER"

    private String proofImageUrl;         // Đường dẫn ảnh biên lai

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING_VERIFY;

    private String transactionCode;       // Mã chuyển khoản tự sinh

    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;     // Thời gian admin duyệt

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}