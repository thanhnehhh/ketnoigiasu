package com.thanh.ketnoigiasubackend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {
    private Long id;

    // Thông tin cơ bản của gia sư (Không lôi cả đống user/profile ra)
    private Long tutorId;
    private String tutorName;
    private String tutorEmail;

    // Thông tin hợp đồng
    private String contentSnapshot;
    private String signatureBase64;
    private String status;
    private LocalDateTime signedAt;
    private LocalDateTime createdAt;
}