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

    /** Gửi báo cáo học tập HTML cho phụ huynh */
    @Async
    public void sendReportEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("Kết Nối Gia Sư <thanhtran280204@gmail.com>");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML
            mailSender.send(mimeMessage);
            System.out.println("✅ Gửi báo cáo thành công đến: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ GỬI BÁO CÁO THẤT BẠI đến " + toEmail);
            e.printStackTrace();
            throw new RuntimeException("Không thể gửi báo cáo đến email \"" + toEmail + "\".");
        }
    }
}