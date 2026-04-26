package com.thanh.ketnoigiasubackend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReportResponse {
    private Long id;
    private Long registrationId;
    private String studentName;
    private String tutorName;
    private String title;
    private String content;
    private String status;
    private String adminNotes;
    private LocalDateTime createdAt;
}