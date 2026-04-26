package com.thanh.ketnoigiasubackend.dto.response;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private String studentName;
    private String courseTitle;
    private Integer rating;
    private String comment;
    private String tutorReply;
    private LocalDateTime repliedAt;

    private LocalDateTime createdAt;
}