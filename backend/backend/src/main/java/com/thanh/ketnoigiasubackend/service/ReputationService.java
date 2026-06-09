package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Quản lý điểm uy tín (Reputation Score) của gia sư.
 *
 * Thang điểm: 0 - 100, mặc định 50 khi tạo mới.
 *
 * Quy tắc cộng/trừ:
 *  - Review 5 sao  → +10
 *  - Review 4 sao  → +7
 *  - Review 3 sao  → +3
 *  - Review 2 sao  → -5
 *  - Review 1 sao  → -10
 *  - Khóa học hoàn thành (không có review) → +2
 *  - Báo cáo vi phạm được Admin xác nhận   → -15
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReputationService {

    private final TutorProfileRepository tutorProfileRepository;

    /** Cộng/trừ điểm theo rating của review mới */
    @Transactional
    public void updateOnReview(TutorProfile tutor, int rating) {
        int delta = switch (rating) {
            case 5 -> 10;
            case 4 -> 7;
            case 3 -> 3;
            case 2 -> -5;
            case 1 -> -10;
            default -> 0;
        };
        applyDelta(tutor, delta, "review " + rating + " sao");
    }

    /** Cộng điểm khi khóa học hoàn thành (không cần có review) */
    @Transactional
    public void updateOnCourseCompleted(TutorProfile tutor) {
        applyDelta(tutor, 2, "khóa học hoàn thành");
    }

    /** Trừ điểm khi báo cáo vi phạm được Admin xác nhận */
    @Transactional
    public void updateOnViolationConfirmed(TutorProfile tutor) {
        applyDelta(tutor, -15, "vi phạm được xác nhận");
    }

    /** Tính nhãn uy tín từ số điểm */
    public static String getLabel(int score) {
        if (score >= 85) return "Xuất sắc";
        if (score >= 70) return "Tốt";
        if (score >= 50) return "Trung bình";
        return "Cần cải thiện";
    }

    /** Tính màu badge theo điểm */
    public static String getColor(int score) {
        if (score >= 85) return "#10b981"; // xanh lá
        if (score >= 70) return "#3b82f6"; // xanh dương
        if (score >= 50) return "#f59e0b"; // vàng
        return "#ef4444";                  // đỏ
    }

    // ======== PRIVATE ========

    private void applyDelta(TutorProfile tutor, int delta, String reason) {
        int oldScore = tutor.getReputationScore();
        int newScore = Math.max(0, Math.min(100, oldScore + delta));
        tutor.setReputationScore(newScore);
        tutorProfileRepository.save(tutor);
        log.info("[Reputation] Tutor {} | {} | {} → {} (delta: {})",
                tutor.getUser().getFullName(), reason, oldScore, newScore, delta);
    }
}
