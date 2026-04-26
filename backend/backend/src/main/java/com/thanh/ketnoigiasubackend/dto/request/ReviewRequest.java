package com.thanh.ketnoigiasubackend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReviewRequest {
    private Long registrationId;
    private Integer rating;
    private String comment;
}