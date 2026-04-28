package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

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
}