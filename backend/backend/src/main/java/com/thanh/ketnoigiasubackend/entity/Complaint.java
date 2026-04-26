package com.thanh.ketnoigiasubackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Complaint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private TutorProfile tutor;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(nullable = false)
    private String status; // PENDING, REJECTED, ACCEPTED

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }
}