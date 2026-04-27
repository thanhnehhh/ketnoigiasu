package com.thanh.ketnoigiasubackend.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialResponse {
    private Long id;
    private String title;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String tutorName;
    private Long courseId;
    private String createdAt; // Để String cho FE dễ hiển thị
}