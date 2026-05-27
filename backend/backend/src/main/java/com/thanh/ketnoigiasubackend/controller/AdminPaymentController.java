package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.PaymentService;
import com.thanh.ketnoigiasubackend.service.RefundService;
import com.thanh.ketnoigiasubackend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {
    private final PaymentService paymentService;
    private final RefundService refundService;
    private final FileStorageService fileStorageService;

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingPayments() {
        return ResponseEntity.ok(paymentService.getAllPendingPayments());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approvePayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.approvePayment(id));
    }

    // Xem tất cả yêu cầu hoàn tiền đang chờ
    @GetMapping("/refunds/pending")
    public ResponseEntity<?> getPendingRefunds() {
        return ResponseEntity.ok(refundService.getPendingRefunds());
    }

    // Duyệt hoặc từ chối yêu cầu hoàn tiền
    @PutMapping("/refunds/{id}/resolve")
    public ResponseEntity<?> resolveRefund(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(refundService.resolveRefund(id, body.get("action"), body.getOrDefault("adminNote", "")));
    }

    // Thống kê tài chính tổng quan cho Admin
    @GetMapping("/finance-summary")
    public ResponseEntity<?> getFinanceSummary() {
        return ResponseEntity.ok(paymentService.getAdminFinanceSummary());
    }

    // Danh sách học phí chưa chuyển tiền cho gia sư
    @GetMapping("/pending-transfer")
    public ResponseEntity<?> getPendingTransfer() {
        return ResponseEntity.ok(paymentService.getPendingTransferToTutor());
    }

    // Admin đánh dấu đã chuyển tiền + upload minh chứng
    @PostMapping("/{id}/mark-transferred")
    public ResponseEntity<?> markTransferred(
            @PathVariable Long id,
            @RequestParam(value = "proof", required = false) MultipartFile proofFile) {
        String proofUrl = null;
        if (proofFile != null && !proofFile.isEmpty()) {
            String savedName = fileStorageService.save(proofFile);
            proofUrl = "/api/materials/download/" + savedName;
        }
        return ResponseEntity.ok(paymentService.markTransferredToTutor(id, proofUrl));
    }

    // Lịch sử đã chuyển tiền cho gia sư
    @GetMapping("/transfer-history")
    public ResponseEntity<?> getTransferHistory() {
        return ResponseEntity.ok(paymentService.getTransferHistory());
    }
}