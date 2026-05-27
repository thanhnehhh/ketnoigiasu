package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;

    @PostMapping("/platform-fee")
    public ResponseEntity<?> submitPlatformFee(@RequestBody String proofImageUrl) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(paymentService.createPlatformFeeRequest(email, proofImageUrl));
    }

    @PutMapping("/{id}/submit-proof")
    public ResponseEntity<?> submitPaymentProof(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        String proofImageUrl = body.get("proofImageUrl");
        return ResponseEntity.ok(paymentService.submitProof(id, proofImageUrl, email));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyPayments() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(paymentService.getMyPayments(email));
    }

    // Tóm tắt tài chính cho gia sư: doanh thu, phí sàn, lịch sử nhận tiền
    @GetMapping("/tutor/summary")
    public ResponseEntity<?> getTutorSummary(Authentication auth) {
        return ResponseEntity.ok(paymentService.getTutorPaymentSummary(auth.getName()));
    }

    // Lịch sử học phí học viên đã trả
    @GetMapping("/tutor/income-history")
    public ResponseEntity<?> getIncomeHistory(Authentication auth) {
        return ResponseEntity.ok(paymentService.getTutorIncomeHistory(auth.getName()));
    }

    // Cập nhật thông tin tài khoản thụ hưởng
    @PutMapping("/tutor/bank-info")
    public ResponseEntity<?> updateBankInfo(@RequestBody Map<String, String> body, Authentication auth) {
        paymentService.updateBankInfo(auth.getName(),
                body.get("bankName"), body.get("bankAccount"), body.get("bankOwner"));
        return ResponseEntity.ok("Đã cập nhật thông tin tài khoản thụ hưởng.");
    }
}