package com.thanh.ketnoigiasubackend.dto.response;

import lombok.*;

@Data @Builder
public class SessionResponse {
    private Long id;
    private Integer sessionOrder;
    private String title;
    private String notes;
    private String onlineLink;
    private boolean isCompleted;
    private String startTime;
    private String createdAt;
    private boolean canConfirm;
    private String studentFeedback;      // Phản hồi của học viên

    // Xác nhận 2 chiều
    private boolean studentConfirmed;    // Học viên đã xác nhận?
    private boolean studentDisputed;     // Học viên đang phản đối?
    private String disputeReason;        // Lý do phản đối
    private String studentConfirmedAt;   // Thời điểm học viên xác nhận
    // Frontend dùng để hiện nút "Xác nhận đã học" cho học viên
    private boolean canStudentConfirm;   // true = gia sư đã dạy xong nhưng học viên chưa xác nhận
}