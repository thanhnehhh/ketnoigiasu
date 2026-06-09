package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** Lấy toàn bộ user (trừ password) */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword) {

        List<User> users = userRepository.findAll().stream()
                .filter(u -> role == null || role.isEmpty() || u.getRole().name().equalsIgnoreCase(role))
                .filter(u -> {
                    if (keyword == null || keyword.isEmpty()) return true;
                    String kw = keyword.toLowerCase();
                    return u.getFullName().toLowerCase().contains(kw)
                            || u.getEmail().toLowerCase().contains(kw);
                })
                .toList();

        return ResponseEntity.ok(users.stream().map(u -> Map.of(
                "id",        u.getId(),
                "email",     u.getEmail(),
                "fullName",  u.getFullName(),
                "role",      u.getRole().name(),
                "phone",     u.getPhone() != null ? u.getPhone() : "",
                "enabled",   u.isEnabled(),
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        )).toList());
    }

    /** Khóa / mở khóa tài khoản */
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);

        String msg = user.isEnabled()
                ? "✅ Tài khoản của bạn đã được mở khóa bởi Admin."
                : "⚠️ Tài khoản của bạn đã bị khóa bởi Admin. Liên hệ hỗ trợ nếu có thắc mắc.";
        notificationService.createNotification(user, msg, "/");

        return ResponseEntity.ok(Map.of(
                "enabled", user.isEnabled(),
                "message", user.isEnabled() ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"
        ));
    }

    /** Xóa tài khoản (soft: chỉ disable, không xóa DB) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> disableUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        user.setEnabled(false);
        userRepository.save(user);
        return ResponseEntity.ok("Đã vô hiệu hóa tài khoản.");
    }
}
