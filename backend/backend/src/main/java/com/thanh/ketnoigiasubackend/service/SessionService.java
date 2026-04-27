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

    @Transactional
    public SessionResponse createSession(Long courseId, SessionRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));

        // 1. Lưu buổi học vào DB
        CourseSession session = CourseSession.builder()
                .course(course)
                .title(request.getTitle())
                .notes(request.getNotes())
                .onlineLink(request.getOnlineLink())
                .startTime(request.getStartTime() != null ?
                        LocalDateTime.parse(request.getStartTime()) : LocalDateTime.now())
                .isCompleted(false)
                .build();

        CourseSession saved = sessionRepository.save(session);

        // 2. Gửi thông báo cho TẤT CẢ học viên trong lớp (Bỏ filter status để test cho dễ)
        if (course.getRegistrations() != null && !course.getRegistrations().isEmpty()) {
            boolean isOnline = request.getOnlineLink() != null && !request.getOnlineLink().trim().isEmpty();
            String message = isOnline ?
                    "Lớp học online đã mở! Click để vào học: " + request.getTitle() :
                    "Gia sư vừa cập nhật lịch học mới cho lớp: " + course.getTitle();

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
        return sessionRepository.findByCourseIdOrderByStartTimeDesc(courseId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public SessionResponse updateSessionLog(Long sessionId, String notes) {
        CourseSession currentSession = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học"));

        // 1. Logic chặn dạy nhảy buổi
        if (currentSession.getSessionOrder() > 1) {
            CourseSession previousSession = sessionRepository
                    .findByCourseIdAndSessionOrder(currentSession.getCourse().getId(), currentSession.getSessionOrder() - 1)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học trước đó"));

            if (!previousSession.isCompleted()) {
                throw new RuntimeException("Bạn chưa hoàn thành nhật ký buổi " + (currentSession.getSessionOrder() - 1));
            }
        }

        // 2. Cập nhật
        currentSession.setNotes(notes);
        currentSession.setCompleted(true);
        currentSession.setUpdatedAt(LocalDateTime.now()); // Hết lỗi setUpdatedAt ở đây

        return mapToResponse(sessionRepository.save(currentSession));
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
        return SessionResponse.builder()
                .id(s.getId())
                .title(s.getTitle())
                .notes(s.getNotes())
                .onlineLink(s.getOnlineLink())
                .isCompleted(s.isCompleted())
                .startTime(s.getStartTime() != null ? s.getStartTime().toString() : "")
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