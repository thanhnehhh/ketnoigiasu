package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class SendOtpRequest {
    private String email;
    private String role;
}