package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.entity.SystemConfig;
import com.thanh.ketnoigiasubackend.repository.SystemConfigRepository;
import com.thanh.ketnoigiasubackend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class SystemConfigController {

    private final SystemConfigRepository configRepository;
    private final FileStorageService fileStorageService;

    /** Public: lấy thông tin thanh toán admin */
    @GetMapping("/api/public/payment-info")
    public ResponseEntity<Map<String, String>> getPaymentInfo() {
        Map<String, String> result = new HashMap<>();
        result.put("bankName",    getConfig("admin.bankName", ""));
        result.put("bankAccount", getConfig("admin.bankAccount", ""));
        result.put("bankOwner",   getConfig("admin.bankOwner", ""));
        result.put("qrImageUrl",  getConfig("admin.qrImageUrl", ""));
        return ResponseEntity.ok(result);
    }

    /** Admin: cập nhật thông tin ngân hàng */
    @PutMapping("/api/admin/payment-info")
    public ResponseEntity<?> updatePaymentInfo(@RequestBody Map<String, String> body) {
        saveConfig("admin.bankName",    body.getOrDefault("bankName", ""));
        saveConfig("admin.bankAccount", body.getOrDefault("bankAccount", ""));
        saveConfig("admin.bankOwner",   body.getOrDefault("bankOwner", ""));
        return ResponseEntity.ok("Đã cập nhật thông tin thanh toán");
    }

    /** Admin: upload ảnh QR */
    @PostMapping("/api/admin/payment-info/qr")
    public ResponseEntity<?> uploadQR(@RequestParam("file") MultipartFile file) {
        String savedName = fileStorageService.save(file);
        saveConfig("admin.qrImageUrl", savedName);
        return ResponseEntity.ok(Map.of("qrImageUrl", savedName));
    }

    private String getConfig(String key, String defaultVal) {
        return configRepository.findById(key).map(SystemConfig::getValue).orElse(defaultVal);
    }

    private void saveConfig(String key, String value) {
        configRepository.save(new SystemConfig(key, value));
    }
}
