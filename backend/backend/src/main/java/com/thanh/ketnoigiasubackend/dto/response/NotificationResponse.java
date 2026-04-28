package com.thanh.ketnoigiasubackend.dto.response;

import lombok.*;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private boolean isRead;
    private String createdAt;
}