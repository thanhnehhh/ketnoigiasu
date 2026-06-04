package com.thanh.ketnoigiasubackend.scheduler;

import com.thanh.ketnoigiasubackend.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tự động xác nhận các buổi học mà gia sư đã ghi nhật ký
 * nhưng học viên chưa bấm xác nhận sau 48 giờ.
 *
 * Chạy mỗi giờ để kiểm tra.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SessionConfirmScheduler {

    private final SessionService sessionService;

    // Chạy mỗi giờ (3600000 ms)
    @Scheduled(fixedDelay = 3_600_000)
    public void autoConfirmExpiredSessions() {
        log.info("[Scheduler] Kiểm tra auto-confirm buổi học quá 48h...");
        try {
            sessionService.autoConfirmExpiredSessions();
        } catch (Exception e) {
            log.error("[Scheduler] Lỗi khi auto-confirm sessions: {}", e.getMessage());
        }
    }
}
