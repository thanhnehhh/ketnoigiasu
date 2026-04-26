package com.thanh.ketnoigiasubackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "registration_id", nullable = false)
    private CourseRegistration registration;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @Column(nullable = false)
    private String title; // Tiêu đề báo cáo

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // Nội dung tố cáo

    @Column(nullable = false)
    private String status; // PENDING, RESOLVED

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }
}