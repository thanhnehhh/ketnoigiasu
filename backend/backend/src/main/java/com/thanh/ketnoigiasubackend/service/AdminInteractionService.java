package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.ComplaintResponse;
import com.thanh.ketnoigiasubackend.dto.response.ReportResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.CourseStatus;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminInteractionService {
    private final ReportRepository reportRepository;
    private final ComplaintRepository complaintRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final CourseRepository courseRepository; // Đã thêm repo này để hết lỗi đỏ

    // --- REPORT ---
    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream()
                .map(report -> ReportResponse.builder()
                        .id(report.getId())
                        .registrationId(report.getRegistration().getId())
                        .studentName(report.getStudent().getUser().getFullName())
                        .tutorName(report.getRegistration().getCourse().getTutor().getUser().getFullName())
                        .title(report.getTitle())
                        .content(report.getContent())
                        .status(report.getStatus())
                        .createdAt(report.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // MỨC 2: KHÓA TÀI KHOẢN (Hiệu ứng dây chuyền toàn bộ)
    @Transactional
    public void resolveReport(Long reportId, String resolution) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));

        report.setStatus("RESOLVED");
        reportRepository.save(report);

        TutorProfile tutor = report.getRegistration().getCourse().getTutor();
        User tutorUser = tutor.getUser();

        // 1. Khóa tài khoản
        tutorUser.setEnabled(false);
        userRepository.save(tutorUser);

        // 2. Tự động ẨN tất cả khóa học của gia sư này
        List<Course> tutorCourses = courseRepository.findByTutorId(tutor.getId());
        for (Course course : tutorCourses) {
            course.setStatus(CourseStatus.HIDDEN);
        }
        courseRepository.saveAll(tutorCourses);

        // 3. Tự động HỦY tất cả các lớp đang học (ACCEPTED, IN_PROGRESS)
        List<CourseRegistration> activeRegs = registrationRepository.findByCourseInAndStatusIn(
                tutorCourses, List.of("ACCEPTED", "IN_PROGRESS"));

        for (CourseRegistration reg : activeRegs) {
            reg.setStatus("CANCELLED_BY_ADMIN");
            reg.setNotes("Hệ thống tự động hủy do Gia sư bị khóa tài khoản.");

            // Thông báo cho từng học viên bị ảnh hưởng
            notificationService.createNotification(reg.getStudent().getUser(),
                    "Lớp học '" + reg.getCourse().getTitle() + "' đã bị hủy do Gia sư vi phạm nghiêm trọng chính sách.");
        }
        registrationRepository.saveAll(activeRegs);
    }

    @Transactional
    public void hideCourse(Long courseId, String reason) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));

        // 1. Chuyển trạng thái khóa học sang HIDDEN (Tàng hình)
        course.setStatus(CourseStatus.HIDDEN);
        courseRepository.save(course);

        // 2. Nội dung thông báo "Thượng phương bảo kiếm"
        String warningMessage = String.format(
                "CẢNH BÁO LẦN 1: Khóa học '%s' đã bị ẩn do: %s. " +
                        "Yêu cầu bạn điều chỉnh lại nội dung. Nếu tiếp tục vi phạm, tài khoản của bạn sẽ bị KHÓA VĨNH VIỄN theo điều khoản hợp đồng gia sư.",
                course.getTitle(), reason
        );

        // 3. Gửi thông báo cho Gia sư
        notificationService.createNotification(course.getTutor().getUser(), warningMessage);

        // 4. Thông báo cho các học viên đang đăng ký khóa này (để họ không hoang mang)
        List<CourseRegistration> activeRegs = registrationRepository.findByCourseAndStatusIn(
                course, List.of("ACCEPTED", "IN_PROGRESS"));
        for (CourseRegistration reg : activeRegs) {
            notificationService.createNotification(reg.getStudent().getUser(),
                    "Khóa học '" + course.getTitle() + "' hiện đang được Admin tạm ẩn để kiểm tra chất lượng. " +
                            "Tiến độ học tập của bạn vẫn được lưu vết.");
        }
    }

    // --- COMPLAINT ---
    public List<ComplaintResponse> getAllComplaints() {
        return complaintRepository.findAll().stream()
                .map(complaint -> ComplaintResponse.builder()
                        .id(complaint.getId())
                        .reviewId(complaint.getReview().getId())
                        .tutorName(complaint.getTutor().getUser().getFullName())
                        .reason(complaint.getReason())
                        .status(complaint.getStatus())
                        .createdAt(complaint.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void handleReviewComplaint(Long complaintId, boolean accept) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khiếu nại"));

        if (accept) {
            Review review = complaint.getReview();
            review.setComment("⚠️ Đánh giá này đã bị Admin gỡ bỏ do vi phạm chính sách hệ thống.");
            review.setRating(0);
            reviewRepository.save(review);

            complaint.setStatus("ACCEPTED (Review Removed)");
            notificationService.createNotification(complaint.getTutor().getUser(),
                    "Khiếu nại của bạn thành công. Đánh giá sai sự thật đã bị gỡ bỏ.");
        } else {
            complaint.setStatus("REJECTED");
            notificationService.createNotification(complaint.getTutor().getUser(),
                    "Khiếu nại của bạn bị từ chối. Admin xác nhận đánh giá của học viên là hợp lệ.");
        }
        complaintRepository.save(complaint);
    }

    // --- QUẢN LÝ VẬN HÀNH (NHẬT KÝ & HỦY LỚP) ---
    public Object getTrainingLog(Long registrationId) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học"));

        return java.util.Map.of(
                "registrationId", reg.getId(),
                "courseName", reg.getCourse().getTitle(),
                "studentName", reg.getStudent().getUser().getFullName(),
                "tutorName", reg.getCourse().getTutor().getUser().getFullName(),
                "status", reg.getStatus(),
                "appliedAt", reg.getAppliedAt(),
                "updatedAt", reg.getUpdatedAt(),
                "notes", reg.getNotes() != null ? reg.getNotes() : "Chưa có ghi chú"
        );
    }

    @Transactional
    public void cancelRegistration(Long registrationId, String reason) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học"));

        reg.setStatus("CANCELLED_BY_ADMIN");
        reg.setNotes("Admin hủy lớp: " + reason);
        registrationRepository.save(reg);

        notificationService.createNotification(reg.getStudent().getUser(),
                "Lớp học '" + reg.getCourse().getTitle() + "' đã bị hủy bởi Admin. Lý do: " + reason);
        notificationService.createNotification(reg.getCourse().getTutor().getUser(),
                "Lớp học '" + reg.getCourse().getTitle() + "' đã bị hủy bởi Admin. Lý do: " + reason);
    }


}