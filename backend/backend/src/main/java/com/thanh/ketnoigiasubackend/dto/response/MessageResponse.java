package com.thanh.ketnoigiasubackend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder
public class MessageResponse {
    private Long id;
    private Long courseId;
    private Long senderId;
    private String senderName;
    private String senderRole;  // TUTOR | STUDENT
    private String type;        // TEXT | FILE | EXERCISE
    private String content;
    private String fileUrl;
    private String fileName;
    private LocalDateTime createdAt;
}
