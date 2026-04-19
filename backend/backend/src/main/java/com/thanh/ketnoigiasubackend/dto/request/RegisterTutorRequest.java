package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class RegisterTutorRequest {

    private String fullName;
   // private String password;
    private String gender;
    private LocalDate dateOfBirth;
    private String cccd;
    private String cccdIssuedPlace;
    private String address;
    private String email;
    private String phone;
    private String school;
    private String major;
    private Integer graduationYear;
    private String currentOccupation;
    private String strengths;

    private List<String> subjects;
    private List<String> grades;
}