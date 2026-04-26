package com.thanh.ketnoigiasubackend.entity;

import com.thanh.ketnoigiasubackend.enums.ContractStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    private TutorProfile tutor;

    @Column(columnDefinition = "LONGTEXT")
    private String contentSnapshot; // Văn bản hợp đồng đã điền thông tin

    @Column(columnDefinition = "LONGTEXT")
    private String signatureBase64; // Ảnh chữ ký lưu trực tiếp trong DB

    @Enumerated(EnumType.STRING)
    private ContractStatus status; // PENDING, SIGNED, CANCELLED

    private LocalDateTime signedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}