package com.thanh.ketnoigiasubackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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
            System.err.println("Lỗi chi tiết: " + e.getMessage());
            e.printStackTrace();

            // Throw exception rõ ràng để controller xử lý
            throw new RuntimeException("Không thể gửi OTP đến email \"" + toEmail
                    + "\". Email này có thể không tồn tại hoặc bị chặn. Vui lòng kiểm tra lại địa chỉ email!");
        }
    }
}