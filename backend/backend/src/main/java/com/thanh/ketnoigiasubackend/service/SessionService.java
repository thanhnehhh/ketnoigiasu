package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.SessionRequest;
import com.thanh.ketnoigiasubackend.dto.response.SessionResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final SessionRepository sessionRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;

    // Thay thế cho hàm createSession cũ
    @Transactional
    public SessionResponse updateSessionSchedule(Long sessionId, SessionRequest request) {
        // Tìm cái "khung" buổi học đã được tạo sẵn
        CourseSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học"));

        Course course = session.getCourse();

        // Cập nhật link Meet và giờ học vào khung đó
        session.setOnlineLink(request.getOnlineLink());
        if (request.getStartTime() != null) {
            session.setStartTime(LocalDateTime.parse(request.getStartTime()));
        }

        CourseSession saved = sessionRepository.save(session);

        // Bắn thông báo cho học viên biết lịch học
        if (course.getRegistrations() != null && !course.getRegistrations().isEmpty()) {
            boolean isOnline = request.getOnlineLink() != null && !request.getOnlineLink().trim().isEmpty();
            String message = isOnline ?
                    "Lớp học online đã mở! Click để vào học: " + session.getTitle() :
                    "Gia sư vừa cập nhật lịch học mới cho " + session.getTitle();

            course.getRegistrations().forEach(reg -> {
                if (reg.getStudent() != null && reg.getStudent().getUser() != null) {
                    notificationService.createNotification(reg.getStudent().getUser(), message);
                }
            });
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getSessionsByCourse(Long courseId) {
        return sessionRepository.findByCourseIdOrderBySessionOrderAsc(courseId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public SessionResponse updateSessionLog(Long sessionId, String notes) {
        CourseSession currentSession = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học"));

        // 1. Kiểm tra thời gian: chỉ cho ghi nhật ký sau khi buổi học đã diễn ra
        if (currentSession.getStartTime() == null) {
            throw new RuntimeException("Buổi học này chưa được lên lịch. Vui lòng cập nhật thời gian trước.");
        }
        if (LocalDateTime.now().isBefore(currentSession.getStartTime())) {
            throw new RuntimeException("Buổi học chưa diễn ra. Chỉ có thể xác nhận sau " +
                    currentSession.getStartTime().toLocalDate() + " lúc " +
                    currentSession.getStartTime().toLocalTime().withSecond(0).withNano(0) + ".");
        }

        // 2. Chặn dạy nhảy buổi — phải hoàn thành buổi trước
        if (currentSession.getSessionOrder() > 1) {
            CourseSession previousSession = sessionRepository
                    .findByCourseIdAndSessionOrder(currentSession.getCourse().getId(), currentSession.getSessionOrder() - 1)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học trước đó"));

            if (!previousSession.isCompleted()) {
                throw new RuntimeException("Bạn chưa hoàn thành nhật ký buổi " + (currentSession.getSessionOrder() - 1) +
                        ". Vui lòng hoàn thành theo thứ tự.");
            }
        }

        // 3. Cập nhật nhật ký và đánh dấu hoàn thành
        currentSession.setNotes(notes);
        currentSession.setCompleted(true);
        currentSession.setUpdatedAt(LocalDateTime.now());

        CourseSession saved = sessionRepository.save(currentSession);

        // 4. Thông báo cho học viên biết buổi học đã được xác nhận
        Course course = currentSession.getCourse();
        if (course.getRegistrations() != null) {
            course.getRegistrations().stream()
                    .filter(reg -> "ACTIVE".equals(reg.getStatus()))
                    .forEach(reg -> notificationService.createNotification(
                            reg.getStudent().getUser(),
                            "✅ Gia sư đã xác nhận hoàn thành " + currentSession.getTitle() +
                            " của lớp '" + course.getTitle() + "'.",
                            "/student/course/" + course.getId()
                    ));
        }

        return mapToResponse(saved);
    }

    @Transactional
    public SessionResponse editSessionLog(Long sessionId, String newNotes) {
        CourseSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học"));

        if (!session.isCompleted() || session.getUpdatedAt() == null) {
            throw new RuntimeException("Buổi học này chưa có nhật ký để sửa!");
        }

        // Kiểm tra xem đã quá 24h chưa
        if (LocalDateTime.now().isAfter(session.getUpdatedAt().plusHours(24))) {
            throw new RuntimeException("Đã quá 24h, không thể sửa nhật ký!");
        }

        session.setNotes(newNotes);
        return mapToResponse(sessionRepository.save(session));
    }

    private SessionResponse mapToResponse(CourseSession s) {
        // canConfirm = true khi: có startTime VÀ startTime đã qua VÀ chưa hoàn thành
        boolean canConfirm = !s.isCompleted()
                && s.getStartTime() != null
                && LocalDateTime.now().isAfter(s.getStartTime());

        return SessionResponse.builder()
                .id(s.getId())
                .sessionOrder(s.getSessionOrder())
                .title(s.getTitle())
                .notes(s.getNotes())
                .onlineLink(s.getOnlineLink())
                .isCompleted(s.isCompleted())
                .startTime(s.getStartTime() != null ? s.getStartTime().toString() : "")
                .canConfirm(canConfirm)
                .build();
    }

    @Transactional
    public void initializeSessions(Course course) {
        int total = course.getTotalSessions();
        for (int i = 1; i <= total; i++) {
            CourseSession session = CourseSession.builder()
                    .course(course)
                    .sessionOrder(i)
                    .title("Buổi học số " + i)
                    .notes("") // Nhật ký trống để gia sư điền sau
                    .isCompleted(false)
                    .build();
            sessionRepository.save(session);
        }
    }
}