package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class VerifyOtpRequest {
    private String email;
    private String otp;
    private String role;
}