package com.thanh.ketnoigiasubackend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class RegistrationResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private String tutorName;
    private String studentName;
    private String status; // PENDING, ACCEPTED, REJECTED
    private String notes;
    private Double pricePerSession;
    private LocalDateTime appliedAt;
}