package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportToParentService {

    private final CourseRegistrationRepository registrationRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * Gia sư gửi báo cáo học tập cho phụ huynh học viên.
     * Email phụ huynh = email đăng ký tài khoản học viên (phone = SĐT phụ huynh).
     *
     * @param registrationId ID đăng ký lớp học
     * @param tutorEmail     email gia sư (để xác thực quyền)
     * @param extraNote      ghi chú thêm của gia sư
     */
    public void sendReportToParent(Long registrationId, String tutorEmail, String extraNote) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học"));

        // Kiểm tra quyền — chỉ gia sư của lớp mới gửi được
        if (!reg.getCourse().getTutor().getUser().getEmail().equals(tutorEmail)) {
            throw new RuntimeException("Bạn không có quyền gửi báo cáo cho lớp này");
        }

        // Lấy thông tin
        String studentName  = reg.getStudent().getUser().getFullName();
        String parentEmail  = reg.getStudent().getUser().getEmail();   // email phụ huynh
        String parentPhone  = reg.getStudent().getUser().getPhone();   // SĐT phụ huynh
        String courseTitle  = reg.getCourse().getTitle();
        String tutorName    = reg.getCourse().getTutor().getUser().getFullName();

        // Tính tiến độ
        List<CourseSession> sessions = sessionRepository
                .findByCourseIdOrderBySessionOrderAsc(reg.getCourse().getId());
        long completed = sessions.stream().filter(CourseSession::isCompleted).count();
        long total     = sessions.size();

        // Tạo nội dung email
        String subject = "[Kết Nối Gia Sư] Báo cáo học tập của " + studentName;
        String body = buildEmailBody(studentName, courseTitle, tutorName,
                completed, total, sessions, extraNote, parentPhone);

        emailService.sendReportEmail(parentEmail, subject, body);
    }

    private String buildEmailBody(String studentName, String courseTitle, String tutorName,
                                   long completed, long total,
                                   List<CourseSession> sessions, String extraNote,
                                   String parentPhone) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style='font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:24px;'>");
        sb.append("<h2 style='color:#4f46e5;'>📊 Báo cáo học tập</h2>");
        sb.append("<p>Kính gửi Phụ huynh của <strong>").append(studentName).append("</strong>,</p>");
        sb.append("<p>Gia sư <strong>").append(tutorName).append("</strong> gửi báo cáo tiến độ học tập của con trong khóa học <strong>").append(courseTitle).append("</strong>.</p>");

        // Tiến độ
        int pct = total > 0 ? (int)((completed * 100) / total) : 0;
        sb.append("<div style='background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0;'>");
        sb.append("<h3 style='margin:0 0 12px;color:#1f2937;'>📈 Tiến độ học tập</h3>");
        sb.append("<p>Đã hoàn thành: <strong>").append(completed).append("/").append(total).append(" buổi (").append(pct).append("%)</strong></p>");
        sb.append("<div style='background:#e2e8f0;border-radius:20px;height:12px;'>");
        sb.append("<div style='background:linear-gradient(135deg,#4f46e5,#7c3aed);height:100%;border-radius:20px;width:").append(pct).append("%;'></div>");
        sb.append("</div></div>");

        // Chi tiết từng buổi
        sb.append("<h3 style='color:#1f2937;'>📅 Chi tiết các buổi học</h3>");
        sb.append("<table style='width:100%;border-collapse:collapse;'>");
        sb.append("<tr style='background:#4f46e5;color:white;'><th style='padding:8px;text-align:left;'>Buổi</th><th style='padding:8px;text-align:left;'>Trạng thái</th><th style='padding:8px;text-align:left;'>Nhận xét</th></tr>");
        for (CourseSession s : sessions) {
            String status = s.isCompleted() ? "✅ Hoàn thành" : "⏳ Chưa học";
            String notes  = (s.getNotes() != null && !s.getNotes().isEmpty()) ? s.getNotes() : "—";
            String bg     = s.isCompleted() ? "#f0fdf4" : "#fafafa";
            sb.append("<tr style='background:").append(bg).append(";'>");
            sb.append("<td style='padding:8px;border-bottom:1px solid #e2e8f0;'>").append(s.getTitle()).append("</td>");
            sb.append("<td style='padding:8px;border-bottom:1px solid #e2e8f0;'>").append(status).append("</td>");
            sb.append("<td style='padding:8px;border-bottom:1px solid #e2e8f0;font-size:0.9em;color:#64748b;'>").append(notes).append("</td>");
            sb.append("</tr>");
        }
        sb.append("</table>");

        // Ghi chú thêm
        if (extraNote != null && !extraNote.trim().isEmpty()) {
            sb.append("<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;'>");
            sb.append("<strong>💬 Nhận xét của gia sư:</strong><br/>").append(extraNote);
            sb.append("</div>");
        }

        sb.append("<p style='color:#64748b;font-size:0.9em;margin-top:24px;'>Nếu có thắc mắc, vui lòng liên hệ gia sư qua hệ thống Kết Nối Gia Sư.</p>");
        sb.append("<p style='color:#94a3b8;font-size:0.8em;'>© 2026 Kết Nối Gia Sư</p>");
        sb.append("</div>");
        return sb.toString();
    }
}
