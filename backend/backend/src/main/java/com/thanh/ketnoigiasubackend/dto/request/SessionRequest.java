package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class SessionRequest {
    private String title;
    private String notes;
    private String onlineLink;
    private String startTime; // Định dạng ISO: "2026-04-27T15:00:00"
}