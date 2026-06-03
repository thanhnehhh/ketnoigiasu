package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.FileStorageService;
import com.thanh.ketnoigiasubackend.service.PaymentService;
import com.thanh.ketnoigiasubackend.service.ZaloPayService;
import com.thanh.ketnoigiasubackend.service.VNPayService;
import com.thanh.ketnoigiasubackend.entity.Payment;
import com.thanh.ketnoigiasubackend.repository.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
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
    private final ZaloPayService zaloPayService;
    private final VNPayService vnPayService;
    private final PaymentRepository paymentRepository;

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

    // ===== ZALOPAY =====

    /** Tạo đơn ZaloPay cho hóa đơn học phí */
    @PostMapping("/{id}/zalopay/create")
    public ResponseEntity<?> createZaloPayOrder(@PathVariable Long id, Authentication auth) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
            String studentName = payment.getUser().getFullName();
            String courseTitle = payment.getCourse() != null ? payment.getCourse().getTitle() : "Khóa học";
            long amount = payment.getAmount().longValue();
            Map<String, Object> result = zaloPayService.createOrder(id, amount, studentName, courseTitle);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Polling: kiểm tra trạng thái đơn ZaloPay */
    @GetMapping("/{id}/zalopay/query")
    public ResponseEntity<?> queryZaloPayOrder(
            @PathVariable Long id,
            @RequestParam String appTransId,
            Authentication auth) {
        try {
            Map<String, Object> result = zaloPayService.queryOrder(appTransId);
            // Nếu thanh toán thành công (return_code = 1) → tự động duyệt hóa đơn
            Object returnCode = result.get("return_code");
            if (returnCode != null && returnCode.toString().equals("1")) {
                paymentService.autoApproveByZaloPay(id);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== VNPAY =====

    /** Tạo URL thanh toán VNPay */
    @PostMapping("/{id}/vnpay/create")
    public ResponseEntity<?> createVNPayUrl(@PathVariable Long id,
                                             Authentication auth,
                                             HttpServletRequest request) {
        try {
            Payment payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
            String studentName = payment.getUser().getFullName();
            String courseTitle = payment.getCourse() != null ? payment.getCourse().getTitle() : "Khóa học";
            long amount = payment.getAmount().longValue();
            String url = vnPayService.createPaymentUrl(id, amount, studentName, courseTitle, request);
            return ResponseEntity.ok(Map.of("paymentUrl", url));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** VNPay callback — frontend gọi sau khi redirect về để xác nhận */
    @PostMapping("/vnpay/verify")
    public ResponseEntity<?> verifyVNPay(@RequestBody Map<String, String> params) {
        try {
            boolean valid = vnPayService.verifySignature(params);
            if (!valid) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Chữ ký không hợp lệ"));

            String responseCode = params.get("vnp_ResponseCode");
            Long paymentId = Long.parseLong(params.get("paymentId"));

            if ("00".equals(responseCode)) {
                paymentService.autoApproveByVNPay(paymentId);
                return ResponseEntity.ok(Map.of("success", true, "message", "Thanh toán thành công"));
            } else {
                return ResponseEntity.ok(Map.of("success", false, "message", "Thanh toán thất bại hoặc bị hủy (code: " + responseCode + ")"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
