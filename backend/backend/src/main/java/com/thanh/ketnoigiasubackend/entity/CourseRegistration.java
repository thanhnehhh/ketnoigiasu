package com.thanh.ketnoigiasubackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_registrations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @Column(nullable = false)
    private String status;

    private String notes;

    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}