package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class StudentProfileRequest {
    private String fullName;
    private String phone;
    private String address;
    private String gradeLevel;
    private String learningGoals;
}