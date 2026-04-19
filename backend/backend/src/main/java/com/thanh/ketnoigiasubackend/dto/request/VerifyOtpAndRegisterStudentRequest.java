package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class VerifyOtpAndRegisterStudentRequest {
    private String email;
    private String otp;

    private String password;
    private String confirmPassword;
    private RegisterStudentRequest registerData;
}