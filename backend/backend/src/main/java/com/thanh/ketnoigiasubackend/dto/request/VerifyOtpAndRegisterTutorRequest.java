package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class VerifyOtpAndRegisterTutorRequest {
    private String email;
    private String otp;

    private String password;
    private String confirmPassword;

    private RegisterTutorRequest registerData;
}