package com.thanh.ketnoigiasubackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("Kết Nối Gia Sư <thanhtran280204@gmail.com>");
            message.setTo(toEmail);
            message.setSubject("Mã OTP đăng ký - Kết Nối Gia Sư");
            message.setText("Mã OTP của bạn là: " + otp + "\n\n"
                    + "Mã này sẽ hết hạn sau 5 phút.\n"
                    + "Không chia sẻ mã này với bất kỳ ai.");
            mailSender.send(message);
            System.out.println("✅ Gửi OTP thành công đến: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ GỬI OTP THẤT BẠI đến " + toEmail);
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi OTP đến email \"" + toEmail
                    + "\". Vui lòng kiểm tra lại địa chỉ email!");
        }
    }

    // Gửi báo cáo học tập HTML cho phụ huynh
    @Async
    public void sendReportEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("Kết Nối Gia Sư <thanhtran280204@gmail.com>");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
            System.out.println("✅ Gửi báo cáo thành công đến: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ GỬI BÁO CÁO THẤT BẠI đến " + toEmail);
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi báo cáo đến email \"" + toEmail + "\".");
        }
    }

    // Gửi thông báo từ gia sư đến học viên qua email
    @Async
    public void sendAnnouncementEmail(String toEmail, String studentName, String courseTitle, String content) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("Kết Nối Gia Sư <thanhtran280204@gmail.com>");
            helper.setTo(toEmail);
            helper.setSubject("[Kết Nối Gia Sư] Thông báo từ gia sư — " + courseTitle);
            String html = "<div style='font-family:Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:24px;'>"
                + "<h2 style='color:#4f46e5;'>📢 Thông báo từ gia sư</h2>"
                + "<p>Xin chào <strong>" + studentName + "</strong>,</p>"
                + "<p>Gia sư lớp <strong>" + courseTitle + "</strong> vừa gửi thông báo:</p>"
                + "<div style='background:#f0f9ff;border-left:4px solid #4f46e5;padding:14px 18px;border-radius:0 10px 10px 0;margin:16px 0;font-size:1rem;color:#1f2937;'>"
                + content
                + "</div>"
                + "<p style='color:#64748b;font-size:0.88em;'>Vui lòng đăng nhập hệ thống để xem thêm chi tiết.</p>"
                + "<p style='color:#94a3b8;font-size:0.8em;'>© 2026 Kết Nối Gia Sư</p>"
                + "</div>";
            helper.setText(html, true);
            mailSender.send(mimeMessage);
            System.out.println("✅ Gửi thông báo email thành công đến: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Gửi thông báo email thất bại: " + e.getMessage());
        }
    }
}
