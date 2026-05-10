package com.thanh.ketnoigiasubackend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private String actionUrl;  // URL để FE navigate khi click
    @JsonProperty("isRead")
    private boolean isRead;
    private String createdAt;
}