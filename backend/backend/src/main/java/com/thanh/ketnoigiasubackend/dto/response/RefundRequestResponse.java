package com.thanh.ketnoigiasubackend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RefundRequestResponse {
    private Long id;
    private Long paymentId;
    private String courseTitle;
    private Double amount;
    private String studentName;
    private String reason;
    private String evidenceUrl;
    private String status; // PENDING | APPROVED | REJECTED
    private String adminNote;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
