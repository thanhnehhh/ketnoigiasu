package com.thanh.ketnoigiasubackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String subjectName;
    private String tutorName;
    private Long tutorProfileId;   // để frontend link sang trang profile gia sư
    private Double pricePerSession;
    private Integer totalSessions;
    private String status;
    private boolean isPromoted;
    private LocalDateTime promotionExpiration;
    private LocalDateTime createdAt;
    // Ranking fields
    private Double avgRating;
    private Integer registrationCount;
    private Double score;          // điểm tổng hợp để sort
}