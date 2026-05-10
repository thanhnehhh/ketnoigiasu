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
        boolean exists = registrationRepository.findByStudentUserId(user.getId()).stream()
                .anyMatch(r -> r.getCourse().getId().equals(courseId));
        if (exists) throw new RuntimeException("Bạn đã đăng ký khóa học này rồi!");

        CourseRegistration reg = CourseRegistration.builder()
                .course(course).student(student).notes(notes).status("PENDING").build();

        // Thông báo cho gia sư có đơn mới → link đến tab đơn đăng ký
        notificationService.createNotification(course.getTutor().getUser(),
                "📋 Học viên " + user.getFullName() + " vừa đăng ký khóa học '" + course.getTitle() + "'.",
                "/tutor");

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

        reg.setStatus(status);
        CourseRegistration savedRegistration = registrationRepository.save(reg);

        if ("APPROVED".equalsIgnoreCase(status)) {
            Double totalAmount = reg.getCourse().getPricePerSession() * reg.getCourse().getTotalSessions();
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
                    "/student");

            // Thông báo gia sư → link đến tab đơn đăng ký
            notificationService.createNotification(reg.getCourse().getTutor().getUser(),
                    "Đã duyệt đơn của " + reg.getStudent().getUser().getFullName() +
                    " cho lớp '" + reg.getCourse().getTitle() + "'. Đang chờ học viên thanh toán.",
                    "/tutor");

        } else if ("REJECTED".equalsIgnoreCase(status)) {
            // Thông báo học viên bị từ chối → link đến tab khóa học
            notificationService.createNotification(reg.getStudent().getUser(),
                    "❌ Đơn đăng ký lớp '" + reg.getCourse().getTitle() + "' đã bị từ chối.",
                    "/student");
        }

        return mapToResponse(savedRegistration);
    }

    private RegistrationResponse mapToResponse(CourseRegistration reg) {
        return RegistrationResponse.builder()
                .id(reg.getId()).courseId(reg.getCourse().getId())
                .courseTitle(reg.getCourse().getTitle())
                .tutorName(reg.getCourse().getTutor().getUser().getFullName())
                .studentName(reg.getStudent().getUser().getFullName())
                .status(reg.getStatus()).notes(reg.getNotes())
                .pricePerSession(reg.getCourse().getPricePerSession())
                .appliedAt(reg.getAppliedAt())
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
        reg.setStatus("COMPLETED");

        // Thông báo học viên có thể đánh giá → link đến tab khóa học
        notificationService.createNotification(reg.getStudent().getUser(),
                "🎉 Khóa học '" + reg.getCourse().getTitle() + "' đã hoàn thành! Hãy để lại đánh giá cho gia sư.",
                "/student");

        return mapToResponse(registrationRepository.save(reg));
    }
}
