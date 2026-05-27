package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    // Học viên gửi yêu cầu hoàn tiền
    // Body: { paymentId, reason, evidenceUrl }
    @PostMapping
    public ResponseEntity<?> createRefund(@RequestBody Map<String, Object> body, Authentication auth) {
        Long paymentId = Long.valueOf(body.get("paymentId").toString());
        String reason = body.get("reason").toString();
        String evidenceUrl = body.getOrDefault("evidenceUrl", "").toString();
        return ResponseEntity.ok(refundService.createRefundRequest(auth.getName(), paymentId, reason, evidenceUrl));
    }

    // Học viên xem lịch sử yêu cầu hoàn tiền
    @GetMapping("/my")
    public ResponseEntity<?> getMyRefunds(Authentication auth) {
        return ResponseEntity.ok(refundService.getMyRefundRequests(auth.getName()));
    }
}
