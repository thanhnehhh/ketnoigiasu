package com.thanh.ketnoigiasubackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "learning_materials")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LearningMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;       // Tiêu đề tài liệu
    private String fileName;    // Tên file lưu trên ổ cứng
    private String fileType;    // Định dạng file (pdf, docx...)
    private Long fileSize;      // Dung lượng (byte)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id")
    private TutorProfile tutor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course; // Giả sử ông đã có entity Course

    @CreationTimestamp
    private LocalDateTime createdAt;
}