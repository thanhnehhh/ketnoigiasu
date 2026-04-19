package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class RegisterStudentRequest {

    private String fullName;
    private String email;
  //  private String password;
    private String phone;
    private String address;
    private String gradeLevel;
    private String learningGoals;
}