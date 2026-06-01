package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CourseRequest {
    private String title;
    private String description;
    private Double pricePerSession;
    private Integer totalSessions;
    private Long subjectId;
    private String teachingMode; // ONLINE | OFFLINE | BOTH
}