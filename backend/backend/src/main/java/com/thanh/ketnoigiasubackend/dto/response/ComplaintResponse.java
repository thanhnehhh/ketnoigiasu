package com.thanh.ketnoigiasubackend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ComplaintResponse {
    private Long id;
    private Long reviewId;
    private String tutorName;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
}