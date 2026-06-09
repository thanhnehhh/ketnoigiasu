package com.thanh.ketnoigiasubackend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data @Builder
public class SessionResponse {
    private Long id;
    private Integer sessionOrder;
    private String title;
    private String notes;
    private String onlineLink;

    // Bắt buộc dùng @JsonProperty để Jackson serialize đúng key "isCompleted"
    // Không có annotation này, Lombok @Data sinh getter isCompleted() → Jackson đổi thành "completed"
    @JsonProperty("isCompleted")
    private boolean isCompleted;

    private String startTime;
    private String createdAt;

    @JsonProperty("canConfirm")
    private boolean canConfirm;

    private String studentFeedback;

    // Xác nhận 2 chiều — dùng Boolean (wrapper) tránh null khi row cũ chưa có giá trị
    @JsonProperty("studentConfirmed")
    private boolean studentConfirmed;

    @JsonProperty("studentDisputed")
    private boolean studentDisputed;

    private String disputeReason;
    private String studentConfirmedAt;

    @JsonProperty("canStudentConfirm")
    private boolean canStudentConfirm;

    // Phí sàn buổi học
    private Double sessionFee;    // số tiền phí sàn VNĐ
    private String sessionMode;   // "ONLINE" | "OFFLINE"
}