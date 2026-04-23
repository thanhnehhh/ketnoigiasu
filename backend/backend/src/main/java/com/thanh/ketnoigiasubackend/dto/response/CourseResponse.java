package com.thanh.ketnoigiasubackend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CourseResponse {
    private Long id;
    private String title;
    private String subjectName;
    private String tutorName; // Chỉ lấy tên thôi, lấy chi cả object
    private Double pricePerSession;
    private Integer totalSessions;
    private String status;
    private boolean isPromoted;
}