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
    private User user;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "registration_id")
    private CourseRegistration registration;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String paymentType;

    private String proofImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING_VERIFY;

    private String transactionCode;

    // Admin đánh dấu đã chuyển tiền cho gia sư (sau khi khấu trừ phí sàn)
    @Builder.Default
    private boolean transferredToTutor = false;
    private LocalDateTime transferredAt;
    private String transferProofUrl;  // Minh chứng chuyển khoản của Admin

    private LocalDateTime createdAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime expiresAt;
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}