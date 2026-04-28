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
public class StudentProfileResponse {

    private Long id;
    private Long userId;
    private String email;
    private String fullName;
    private String phone;
    private String role;

    private String address;
    private String gradeLevel;
    private String learningGoals;

    private String avatar;
    private LocalDateTime createdAt;
}