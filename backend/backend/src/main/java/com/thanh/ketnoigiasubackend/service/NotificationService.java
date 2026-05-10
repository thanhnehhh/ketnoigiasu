package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.NotificationResponse;
import com.thanh.ketnoigiasubackend.entity.Notification;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    /** Tạo thông báo không có link */
    @Transactional
    public void createNotification(User user, String message) {
        createNotification(user, message, null);
    }

    /** Tạo thông báo có actionUrl — FE sẽ navigate đến URL này khi click */
    @Transactional
    public void createNotification(User user, String message, String actionUrl) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .actionUrl(actionUrl)
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .message(n.getMessage())
                        .actionUrl(n.getActionUrl())
                        .isRead(n.isRead())
                        .createdAt(n.getCreatedAt().toString())
                        .build())
                .toList();
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markOneReadByIdAndUserId(notificationId, userId);
        if (updated == 0) {
            throw new RuntimeException("Không tìm thấy thông báo hoặc không có quyền");
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }
}
