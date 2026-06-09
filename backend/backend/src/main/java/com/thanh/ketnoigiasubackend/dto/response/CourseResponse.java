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
    private Long subjectId;         // để frontend pre-fill đúng môn khi sửa
    private Double pricePerSession;
    private Integer totalSessions;
    private String status;
    private boolean isPromoted;
    private LocalDateTime promotionExpiration;
    private LocalDateTime createdAt;
    // Ranking fields
    private Double avgRating;
    private Integer registrationCount;
    private Double score;
    private String teachingMode;
    private boolean hasApprovedStudent;
    private String schedule;
    private String tutorAddress; // để học viên xem bản đồ khoảng cách
}