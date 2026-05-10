package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.NotificationResponse;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        User user = getCurrentUser();
        return ResponseEntity.ok(notificationService.getMyNotifications(user.getId()));
    }

    // Đánh dấu 1 thông báo đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        User user = getCurrentUser();
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok("Đã đánh dấu đã đọc.");
    }

    // Đánh dấu tất cả đã đọc
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        User user = getCurrentUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok("Đã đánh dấu tất cả là đã đọc.");
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
