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
    private final CourseRegistrationRepository courseRegistrationRepository;

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
                    notificationService.createNotification(reg.getStudent().getUser(), message,
                            "/student/course/" + course.getId());
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

        // 4. Thông báo cho học viên biết buổi học đã được xác nhận, yêu cầu xác nhận lại
        Course course = currentSession.getCourse();
        if (course.getRegistrations() != null) {
            course.getRegistrations().stream()
                    .filter(reg -> "ACTIVE".equals(reg.getStatus()))
                    .forEach(reg -> notificationService.createNotification(
                            reg.getStudent().getUser(),
                            "📋 Gia sư đã ghi nhật ký " + currentSession.getTitle() +
                            " — lớp '" + course.getTitle() + "'. Vui lòng xác nhận đã học trong 48h.",
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
        boolean canConfirm = !s.isCompleted()
                && s.getStartTime() != null
                && LocalDateTime.now().isAfter(s.getStartTime());

        // Học viên có thể xác nhận khi: gia sư đã ghi nhật ký (isCompleted)
        // nhưng học viên chưa xác nhận và chưa phản đối
        boolean canStudentConfirm = s.isCompleted()
                && !s.isStudentConfirmed()
                && !s.isStudentDisputed();

        return SessionResponse.builder()
                .id(s.getId())
                .sessionOrder(s.getSessionOrder())
                .title(s.getTitle())
                .notes(s.getNotes())
                .onlineLink(s.getOnlineLink())
                .isCompleted(s.isCompleted())
                .startTime(s.getStartTime() != null ? s.getStartTime().toString() : "")
                .canConfirm(canConfirm)
                .studentFeedback(s.getStudentFeedback())
                .studentConfirmed(s.isStudentConfirmed())
                .studentDisputed(s.isStudentDisputed())
                .disputeReason(s.getDisputeReason())
                .studentConfirmedAt(s.getStudentConfirmedAt() != null ? s.getStudentConfirmedAt().toString() : null)
                .canStudentConfirm(canStudentConfirm)
                .build();
    }

    /** Học viên gửi phản hồi cho buổi học đã hoàn thành */
    @Transactional
    public SessionResponse submitStudentFeedback(Long sessionId, String feedback, String studentEmail) {
        CourseSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học"));
        if (!session.isCompleted())
            throw new RuntimeException("Buổi học chưa hoàn thành, chưa thể phản hồi!");
        session.setStudentFeedback(feedback);
        return mapToResponse(sessionRepository.save(session));
    }

    /**
     * Học viên xác nhận đã học buổi này.
     * Gọi sau khi gia sư đã ghi nhật ký (isCompleted = true).
     * Nếu đây là buổi cuối → trigger auto-complete khóa học.
     */
    @Transactional
    public SessionResponse studentConfirmSession(Long sessionId, String studentEmail) {
        CourseSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học"));

        if (!session.isCompleted())
            throw new RuntimeException("Gia sư chưa xác nhận buổi học này.");
        if (session.isStudentConfirmed())
            throw new RuntimeException("Bạn đã xác nhận buổi học này rồi.");
        if (session.isStudentDisputed())
            throw new RuntimeException("Bạn đang phản đối buổi học này. Hãy liên hệ Admin để giải quyết trước.");

        session.setStudentConfirmed(true);
        session.setStudentConfirmedAt(LocalDateTime.now());
        CourseSession saved = sessionRepository.save(session);

        // Thông báo cho gia sư biết học viên đã xác nhận
        Course course = session.getCourse();
        notificationService.createNotification(
                course.getTutor().getUser(),
                "✅ Học viên đã xác nhận hoàn thành " + session.getTitle() + " — lớp '" + course.getTitle() + "'.",
                "/tutor/course/" + course.getId()
        );

        // Kiểm tra auto-complete toàn khóa (chỉ tính những buổi đã có studentConfirmed=true hoặc đã auto-confirm)
        tryAutoCompleteForStudent(course, studentEmail);

        return mapToResponse(saved);
    }

    /**
     * Học viên phản đối buổi học (nghi ngờ gia sư không dạy thực sự).
     * Admin sẽ xem xét và xử lý thủ công.
     */
    @Transactional
    public SessionResponse studentDisputeSession(Long sessionId, String reason, String studentEmail) {
        CourseSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học"));

        if (!session.isCompleted())
            throw new RuntimeException("Gia sư chưa xác nhận buổi học này nên không thể phản đối.");
        if (session.isStudentConfirmed())
            throw new RuntimeException("Bạn đã xác nhận buổi học này. Không thể phản đối sau khi xác nhận.");
        if (session.isStudentDisputed())
            throw new RuntimeException("Bạn đã gửi phản đối cho buổi học này rồi.");
        if (reason == null || reason.isBlank())
            throw new RuntimeException("Vui lòng nhập lý do phản đối.");

        session.setStudentDisputed(true);
        session.setDisputeReason(reason);
        CourseSession saved = sessionRepository.save(session);

        // Thông báo Admin
        Course course = session.getCourse();
        notificationService.notifyAdmins(
                "🚨 Học viên phản đối " + session.getTitle() + " — lớp '" + course.getTitle() +
                "'. Lý do: " + reason,
                "/admin/sessions/" + sessionId
        );
        // Thông báo gia sư
        notificationService.createNotification(
                course.getTutor().getUser(),
                "⚠️ Học viên đang phản đối " + session.getTitle() + ". Admin sẽ xem xét.",
                "/tutor/course/" + course.getId()
        );

        return mapToResponse(saved);
    }

    /**
     * Tự động xác nhận các buổi đã quá 48h mà học viên chưa xác nhận.
     * Gọi từ scheduled job hoặc trigger thủ công.
     */
    @Transactional
    public void autoConfirmExpiredSessions() {
        LocalDateTime deadline = LocalDateTime.now().minusHours(48);
        List<CourseSession> pending = sessionRepository
                .findByIsCompletedTrueAndStudentConfirmedFalseAndStudentDisputedFalseAndUpdatedAtBefore(deadline);

        for (CourseSession s : pending) {
            s.setStudentConfirmed(true);
            s.setStudentConfirmedAt(LocalDateTime.now());
            sessionRepository.save(s);

            // Thông báo cho cả 2 bên
            Course course = s.getCourse();
            course.getRegistrations().stream()
                    .filter(r -> "ACTIVE".equals(r.getStatus()))
                    .forEach(reg -> notificationService.createNotification(
                            reg.getStudent().getUser(),
                            "⏰ Hệ thống đã tự động xác nhận " + s.getTitle() + " (quá 48h không phản hồi).",
                            "/student/course/" + course.getId()
                    ));
            notificationService.createNotification(
                    course.getTutor().getUser(),
                    "✅ " + s.getTitle() + " đã được tự động xác nhận bởi hệ thống.",
                    "/tutor/course/" + course.getId()
            );

            // Thử auto-complete khóa học
            tryAutoCompleteForTutor(course);
        }
    }

    // ======== PRIVATE HELPERS ========

    /**
     * Kiểm tra và hoàn thành khóa học khi học viên xác nhận buổi cuối.
     * Điều kiện: tất cả buổi phải có isCompleted=true VÀ studentConfirmed=true
     */
    private void tryAutoCompleteForStudent(Course course, String studentEmail) {
        List<CourseSession> allSessions = sessionRepository.findByCourseIdOrderBySessionOrderAsc(course.getId());
        boolean allConfirmed = allSessions.stream().allMatch(s -> s.isCompleted() && s.isStudentConfirmed());
        if (!allConfirmed) return;
        doCompleteCourse(course);
    }

    private void tryAutoCompleteForTutor(Course course) {
        List<CourseSession> allSessions = sessionRepository.findByCourseIdOrderBySessionOrderAsc(course.getId());
        boolean allConfirmed = allSessions.stream().allMatch(s -> s.isCompleted() && s.isStudentConfirmed());
        if (!allConfirmed) return;
        doCompleteCourse(course);
    }

    private void doCompleteCourse(Course course) {
        course.getRegistrations().stream()
                .filter(reg -> "ACTIVE".equals(reg.getStatus()))
                .forEach(reg -> {
                    reg.setStatus("COMPLETED");
                    courseRegistrationRepository.save(reg);
                    notificationService.createNotification(reg.getStudent().getUser(),
                            "🎉 Tất cả buổi học đã hoàn thành! Khóa học '" + course.getTitle() +
                            "' đã kết thúc. Hãy để lại đánh giá cho gia sư.",
                            "/student?tab=courses");
                    notificationService.createNotification(course.getTutor().getUser(),
                            "🎓 Khóa học '" + course.getTitle() + "' đã hoàn thành và được học viên xác nhận!",
                            "/tutor?tab=applications");
                });
    }

    @Transactional
    public void initializeSessions(Course course) {
        // Nếu đã có buổi học rồi thì không tạo lại (tránh trùng lặp khi duyệt lại)
        long existing = sessionRepository.findByCourseIdOrderBySessionOrderAsc(course.getId()).size();
        if (existing > 0) return;

        int total = course.getTotalSessions();
        for (int i = 1; i <= total; i++) {
            CourseSession session = CourseSession.builder()
                    .course(course)
                    .sessionOrder(i)
                    .title("Buổi học số " + i)
                    .notes("")
                    .isCompleted(false)
                    .build();
            sessionRepository.save(session);
        }
    }
}