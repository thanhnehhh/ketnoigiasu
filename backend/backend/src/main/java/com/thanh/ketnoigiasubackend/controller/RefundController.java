package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.FileStorageService;
import com.thanh.ketnoigiasubackend.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/student/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;
    private final FileStorageService fileStorageService;

    // Học viên gửi yêu cầu hoàn tiền — nhận file minh chứng
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createRefund(
            @RequestParam Long paymentId,
            @RequestParam String reason,
            @RequestParam(value = "evidence", required = false) MultipartFile evidenceFile,
            Authentication auth) {
        String evidenceUrl = null;
        if (evidenceFile != null && !evidenceFile.isEmpty()) {
            String savedName = fileStorageService.save(evidenceFile);
            evidenceUrl = "/api/materials/download/" + savedName;
        }
        return ResponseEntity.ok(refundService.createRefundRequest(auth.getName(), paymentId, reason, evidenceUrl));
    }

    // Học viên xem lịch sử yêu cầu hoàn tiền
    @GetMapping("/my")
    public ResponseEntity<?> getMyRefunds(Authentication auth) {
        return ResponseEntity.ok(refundService.getMyRefundRequests(auth.getName()));
    }
}
