package com.thanh.ketnoigiasubackend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TutorProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String school;
    private String major;
    private String strengths;
    private String bio;
    private List<CourseResponse> courses;
}