package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter @Setter
public class TutorProfileRequest {
    private String fullName;
    private String phone;
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
    private String subjects;
    private String grades;
}