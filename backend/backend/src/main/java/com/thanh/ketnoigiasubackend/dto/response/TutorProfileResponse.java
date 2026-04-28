package com.thanh.ketnoigiasubackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorProfileResponse {

    private Long id;
    private Long userId;
    private String email;
    private String fullName;
    private String phone;
    private String role;

    // Thông tin Gia sư
    private String gender;
    private LocalDate dateOfBirth;
    private String cccd;
    private String cccdIssuedPlace;
    private String address;
    private String school;
    private String major;
    private Integer graduationYear;
    private String currentOccupation;
    private String strengths;
    private List<String> subjects;
    private List<String> grades;
    private List<CourseResponse> courses;
    private String avatar;
}