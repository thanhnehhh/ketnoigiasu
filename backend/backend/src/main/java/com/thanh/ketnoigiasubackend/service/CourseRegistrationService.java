package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.RegistrationResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.PaymentStatus;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseRegistrationService {

    private final CourseRegistrationRepository registrationRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final SessionRepository sessionRepository;

    @Transactional
    public RegistrationResponse registerCourse(Long courseId, String studentEmail, String notes) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Bạn cần cập nhật hồ sơ Học viên trước!"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));
        if (!"APPROVED".equals(course.getStatus().name()))
            throw new RuntimeException("Khóa học này hiện chưa được kiểm duyệt!");

        // Tự động hủy các đăng ký APPROVED mà hóa đơn TUITION_FEE đã hết hạn (chưa thanh toán)
        registrationRepository.findByCourseId(courseId).stream()
                .filter(r -> "APPROVED".equals(r.getStatus()))
                .forEach(r -> {
                    boolean invoiceExpired = paymentRepository.findByUserIdOrderByCreatedAtDesc(
                            r.getStudent().getUser().getId()).stream()
                            .anyMatch(p -> "TUITION_FEE".equals(p.getPaymentType())
                                    && p.getRegistration() != null
                                    && p.getRegistration().getId().equals(r.getId())
                                    && p.getStatus() == PaymentStatus.PENDING
                                    && p.getExpiresAt() != null
                                    && LocalDateTime.now().isAfter(p.getExpiresAt()));
                    if (invoiceExpired) {
                        r.setStatus("REJECTED");
                        registrationRepository.save(r);
                    }
                });

        // 1 lớp chỉ 1 học viên — check APPROVED hoặc ACTIVE (không block nếu COMPLETED vì lớp đã xong)
        boolean hasActiveStudent = registrationRepository.findByCourseId(courseId).stream()
                .anyMatch(r -> "APPROVED".equals(r.getStatus()) || "ACTIVE".equals(r.getStatus()));
        if (hasActiveStudent)
            throw new RuntimeException("Khóa học này đã có học viên. Vui lòng tìm khóa học khác.");

        // Không cho đăng ký lại nếu đã có đơn PENDING hoặc APPROVED/ACTIVE
        // (REJECTED do hóa đơn hết hạn đã được xử lý ở trên → cho đăng ký lại bình thường)
        boolean exists = registrationRepository.findByStudentUserId(user.getId()).stream()
                .anyMatch(r -> r.getCourse().getId().equals(courseId)
                        && !("REJECTED".equals(r.getStatus()) || "COMPLETED".equals(r.getStatus())));
        if (exists) throw new RuntimeException("Bạn đã đăng ký khóa học này rồi!");

        CourseRegistration reg = CourseRegistration.builder()
                .course(course).student(student).notes(notes).status("PENDING").build();

        // Thông báo cho gia sư có đơn mới → link đến tab đơn đăng ký
        notificationService.createNotification(course.getTutor().getUser(),
                "📋 Học viên " + user.getFullName() + " vừa đăng ký khóa học '" + course.getTitle() + "'.",
                "/tutor?tab=applications");

        return mapToResponse(registrationRepository.save(reg));
    }

    public List<RegistrationResponse> getRegistrationsForStudent(Long studentUserId) {
        return registrationRepository.findByStudentUserId(studentUserId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RegistrationResponse> getApplicationsForTutor(Long tutorUserId) {
        return registrationRepository.findByCourseTutorUserId(tutorUserId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public RegistrationResponse updateStatus(Long registrationId, String status, String email) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đăng ký"));
        if (!reg.getCourse().getTutor().getUser().getEmail().equals(email))
            throw new RuntimeException("Bạn không có quyền duyệt hồ sơ này!");

        // Khi duyệt: kiểm tra xem đã có học viên APPROVED/ACTIVE chưa
        if ("APPROVED".equalsIgnoreCase(status)) {
            boolean hasActiveStudent = registrationRepository.findByCourseId(reg.getCourse().getId())
                    .stream()
                    .filter(r -> !r.getId().equals(registrationId)) // bỏ qua đơn hiện tại
                    .anyMatch(r -> "APPROVED".equals(r.getStatus()) || "ACTIVE".equals(r.getStatus()));
            if (hasActiveStudent)
                throw new RuntimeException("Lớp học đã có học viên khác. Không thể duyệt thêm.");
        }

        reg.setStatus(status);
        CourseRegistration savedRegistration = registrationRepository.save(reg);

        if ("APPROVED".equalsIgnoreCase(status)) {
            Double totalAmount = reg.getCourse().getPricePerSession() * reg.getCourse().getTotalSessions();

            // Tự động từ chối các đơn PENDING khác của cùng khóa học
            registrationRepository.findByCourseId(reg.getCourse().getId()).stream()
                    .filter(r -> !r.getId().equals(registrationId) && "PENDING".equals(r.getStatus()))
                    .forEach(r -> {
                        r.setStatus("REJECTED");
                        registrationRepository.save(r);
                        notificationService.createNotification(r.getStudent().getUser(),
                                "❌ Đơn đăng ký lớp '" + reg.getCourse().getTitle() + "' đã bị từ chối vì lớp đã có học viên khác.",
                                "/student?tab=courses");
                    });

            Payment tuitionFee = Payment.builder()
                    .user(reg.getStudent().getUser())
                    .course(reg.getCourse())
                    .registration(savedRegistration)

                    .paymentType("TUITION_FEE")
                    .amount(totalAmount)
                    .status(PaymentStatus.PENDING)
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();
            Payment savedPayment = paymentRepository.save(tuitionFee);

            // Thông báo học viên → link đến tab hóa đơn
            notificationService.createNotification(reg.getStudent().getUser(),
                    "✅ Đơn đăng ký lớp '" + reg.getCourse().getTitle() + "' đã được duyệt! " +
                    "Vui lòng nộp học phí " + String.format("%,.0f", totalAmount) + "đ trong 24 giờ (Mã HĐ: #" + savedPayment.getId() + ").",
                    "/student?tab=payments");

            // Thông báo gia sư → link đến tab đơn đăng ký
            notificationService.createNotification(reg.getCourse().getTutor().getUser(),
                    "Đã duyệt đơn của " + reg.getStudent().getUser().getFullName() +
                    " cho lớp '" + reg.getCourse().getTitle() + "'. Đang chờ học viên thanh toán.",
                    "/tutor?tab=applications");

        } else if ("REJECTED".equalsIgnoreCase(status)) {
            // Thông báo học viên bị từ chối → link đến tab khóa học
            notificationService.createNotification(reg.getStudent().getUser(),
                    "❌ Đơn đăng ký lớp '" + reg.getCourse().getTitle() + "' đã bị từ chối.",
                    "/student?tab=courses");
        }

        return mapToResponse(savedRegistration);
    }

    private RegistrationResponse mapToResponse(CourseRegistration reg) {
        List<CourseSession> sessions = sessionRepository.findByCourseIdOrderBySessionOrderAsc(reg.getCourse().getId());
        int completed = (int) sessions.stream().filter(CourseSession::isCompleted).count();
        return RegistrationResponse.builder()
                .id(reg.getId()).courseId(reg.getCourse().getId())
                .courseTitle(reg.getCourse().getTitle())
                .tutorName(reg.getCourse().getTutor().getUser().getFullName())
                .studentName(reg.getStudent().getUser().getFullName())
                .status(reg.getStatus()).notes(reg.getNotes())
                .pricePerSession(reg.getCourse().getPricePerSession())
                .appliedAt(reg.getAppliedAt())
                .completedSessions(completed)
                .totalSessions(reg.getCourse().getTotalSessions())
                .build();
    }

    @Transactional
    public RegistrationResponse completeCourse(Long registrationId, String email) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đăng ký"));
        boolean isStudent = reg.getStudent().getUser().getEmail().equals(email);
        boolean isTutor = reg.getCourse().getTutor().getUser().getEmail().equals(email);
        if (!isStudent && !isTutor)
            throw new RuntimeException("Bạn không có quyền xác nhận hoàn thành khóa học này!");

        // Kiểm tra tất cả buổi học đã được gia sư xác nhận hoàn thành chưa
        List<CourseSession> sessions = sessionRepository.findByCourseIdOrderBySessionOrderAsc(reg.getCourse().getId());
        if (sessions.isEmpty())
            throw new RuntimeException("Khóa học chưa có buổi học nào được thiết lập!");

        long completedCount = sessions.stream().filter(CourseSession::isCompleted).count();
        if (completedCount < sessions.size())
            throw new RuntimeException(
                "Chưa thể hoàn thành! Còn " + (sessions.size() - completedCount) +
                "/" + sessions.size() + " buổi học chưa được xác nhận hoàn thành.");

        reg.setStatus("COMPLETED");

        // Thông báo học viên có thể đánh giá → link đến tab khóa học
        notificationService.createNotification(reg.getStudent().getUser(),
                "🎉 Khóa học '" + reg.getCourse().getTitle() + "' đã hoàn thành! Hãy để lại đánh giá cho gia sư.",
                "/student?tab=courses");

        return mapToResponse(registrationRepository.save(reg));
    }
}
