package com.thanh.ketnoigiasubackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tutor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String gender;
    private LocalDate dateOfBirth;
    private String cccd;
    private String cccdIssuedPlace;
    private String address;
    private String school;
    private String major;
    private Integer graduationYear;
    private String currentOccupation;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String subjects;

    @Column(columnDefinition = "TEXT")
    private String grades;

    // Thông tin tài khoản thụ hưởng
    private String bankName;      // Tên ngân hàng
    private String bankAccount;   // Số tài khoản
    private String bankOwner;     // Tên chủ tài khoản

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}