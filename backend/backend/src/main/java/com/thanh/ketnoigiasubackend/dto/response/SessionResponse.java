package com.thanh.ketnoigiasubackend.dto.response;

import lombok.*;

@Data @Builder
public class SessionResponse {
    private Long id;
    private String title;
    private String notes;
    private String onlineLink;
    private boolean isCompleted;
    private String startTime;
    private String createdAt;
}