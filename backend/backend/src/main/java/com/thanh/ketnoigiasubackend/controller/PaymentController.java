package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.FileStorageService;
import com.thanh.ketnoigiasubackend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final FileStorageService fileStorageService;

    @PutMapping("/{id}/submit-proof")
    public ResponseEntity<?> submitPaymentProof(
            @PathVariable Long id,
            @RequestParam(value = "proof", required = false) MultipartFile proofFile,
            @RequestParam(value = "proofImageUrl", required = false) String proofImageUrl) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String finalUrl = proofImageUrl;
        if (proofFile != null && !proofFile.isEmpty()) {
            String savedName = fileStorageService.save(proofFile);
            finalUrl = "/api/materials/download/" + savedName;
        }
        return ResponseEntity.ok(paymentService.submitProof(id, finalUrl, email));
    }

    @PostMapping("/platform-fee")
    public ResponseEntity<?> submitPlatformFee(
            @RequestParam(value = "proof", required = false) MultipartFile proofFile,
            @RequestParam(value = "proofImageUrl", required = false) String proofImageUrl) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String finalUrl = proofImageUrl;
        if (proofFile != null && !proofFile.isEmpty()) {
            String savedName = fileStorageService.save(proofFile);
            finalUrl = "/api/materials/download/" + savedName;
        }
        return ResponseEntity.ok(paymentService.createPlatformFeeRequest(email, finalUrl));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyPayments() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(paymentService.getMyPayments(email));
    }

    @GetMapping("/tutor/summary")
    public ResponseEntity<?> getTutorSummary(Authentication auth) {
        return ResponseEntity.ok(paymentService.getTutorPaymentSummary(auth.getName()));
    }

    @GetMapping("/tutor/income-history")
    public ResponseEntity<?> getIncomeHistory(Authentication auth) {
        return ResponseEntity.ok(paymentService.getTutorIncomeHistory(auth.getName()));
    }

    @PutMapping("/tutor/bank-info")
    public ResponseEntity<?> updateBankInfo(@RequestBody Map<String, String> body, Authentication auth) {
        paymentService.updateBankInfo(auth.getName(),
                body.get("bankName"), body.get("bankAccount"), body.get("bankOwner"));
        return ResponseEntity.ok("Đã cập nhật thông tin tài khoản thụ hưởng.");
    }
}
