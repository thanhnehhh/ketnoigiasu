package com.thanh.ketnoigiasubackend.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data @Builder
public class MessageResponse {
    private Long id;
    private Long courseId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String type;
    private String content;
    private String fileUrl;
    private String fileName;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
