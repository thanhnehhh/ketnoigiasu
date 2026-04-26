package com.thanh.ketnoigiasubackend.dto.request;

import lombok.Data;

@Data
public class ComplaintRequest {
    private Long reviewId;
    private String reason;
}