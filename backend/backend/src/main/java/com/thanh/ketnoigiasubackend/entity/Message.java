package com.thanh.ketnoigiasubackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tin nhắn thuộc lớp học nào
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    // Người gửi
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    // Loại tin nhắn: TEXT | FILE | EXERCISE
    @Column(nullable = false, length = 20)
    private String type; // TEXT, FILE, EXERCISE

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // nội dung text hoặc tên file hoặc đề bài

    // Nếu là FILE/EXERCISE thì lưu URL/path file
    private String fileUrl;
    private String fileName;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
