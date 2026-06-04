package com.thanh.ketnoigiasubackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;
    private Integer sessionOrder;
    private String title;          // Ví dụ: Buổi 1: Ôn tập Đại số 12

    @Column(columnDefinition = "TEXT")
    private String notes;          // Nhật ký nội dung buổi dạy

    private String onlineLink;     // Link Google Meet/Zoom nếu dạy online

    private LocalDateTime startTime;
    private LocalDateTime updatedAt;
    @Builder.Default
    private boolean isCompleted = false; // Xác nhận đã dạy xong hay chưa

    @Column(columnDefinition = "TEXT")
    private String studentFeedback; // Phản hồi của học viên sau buổi học

    // Xác nhận 2 chiều: sau khi gia sư ghi nhật ký (isCompleted=true),
    // học viên cần bấm xác nhận. Nếu quá 48h không xác nhận → tự động duyệt.
    @Builder.Default
    private boolean studentConfirmed = false;  // true = học viên đã xác nhận
    private LocalDateTime studentConfirmedAt;  // thời điểm học viên xác nhận

    // Học viên từ chối buổi học (nghi ngờ gia sư không dạy)
    @Builder.Default
    private boolean studentDisputed = false;   // true = học viên phản đối
    private String disputeReason;              // lý do phản đối

    @CreationTimestamp
    private LocalDateTime createdAt;
}