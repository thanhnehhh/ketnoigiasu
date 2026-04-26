package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class ReportRequest {
    private Long registrationId;
    private String title;
    private String content;
}