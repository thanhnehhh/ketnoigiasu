package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {
    private final PaymentService paymentService;

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingPayments() {
        return ResponseEntity.ok(paymentService.getAllPendingPayments());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approvePayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.approvePayment(id));
    }
}