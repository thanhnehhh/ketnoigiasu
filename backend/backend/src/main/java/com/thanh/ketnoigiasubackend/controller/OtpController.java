package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.*;
import com.thanh.ketnoigiasubackend.dto.response.AuthResponse;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.service.AuthService;
import com.thanh.ketnoigiasubackend.service.EmailService;
import com.thanh.ketnoigiasubackend.service.OtpService;
import com.thanh.ketnoigiasubackend.service.RegisterService;
import com.thanh.ketnoigiasubackend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class OtpController {

    private final OtpService otpService;
    private final EmailService emailService;
    private final RegisterService registerService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final AuthService authService;
    @PostMapping("/send")
    public ResponseEntity<AuthResponse> sendOtp(@RequestBody SendOtpRequest request) {
        try {
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Email không được để trống!"));
            }

            if (!isValidEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Email không hợp lệ! Vui lòng kiểm tra lại."));
            }

            // Kiểm tra email đã tồn tại trong database chưa
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Email này đã được sử dụng để đăng ký. Vui lòng dùng email khác!"));
            }

            String otp = otpService.generateOtp(request.getEmail());

            // Gửi mail - nếu fail sẽ throw exception
            emailService.sendOtpEmail(request.getEmail(), otp);

            return ResponseEntity.ok(new AuthResponse(null,
                    "Mã OTP đã được gửi đến email của bạn. Hiệu lực trong 5 phút." +
                            "Nếu bạn không nhận được mail trong vài phút, vui lòng kiểm tra thư mục Spam hoặc địa chỉ email."));

        } catch (RuntimeException e) {
            // Lỗi từ EmailService (email sai, Gmail từ chối, không kết nối được...)
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, "Có lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }

    // ====================== VERIFY + REGISTER STUDENT ======================
    @PostMapping("/verify/student")
    public ResponseEntity<AuthResponse> verifyOtpAndRegisterStudent(@RequestBody VerifyOtpAndRegisterStudentRequest request) {
        try {
            // 1. Kiểm tra OTP
            boolean isValidOtp = otpService.verifyOtp(request.getEmail(), request.getOtp());
            if (!isValidOtp) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mã OTP không đúng hoặc đã hết hạn!"));
            }

            // 2. Validate mật khẩu TRƯỚC KHI lưu bất kỳ gì vào DB
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mật khẩu không được để trống!"));
            }
            if (request.getConfirmPassword() == null || request.getConfirmPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Vui lòng xác nhận mật khẩu!"));
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mật khẩu và xác nhận mật khẩu không khớp!"));
            }
            if (request.getPassword().length() < 6) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mật khẩu phải có ít nhất 6 ký tự!"));
            }

            // 3. Kiểm tra dữ liệu đăng ký
            if (request.getRegisterData() == null) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Dữ liệu đăng ký không được để trống!"));
            }
            request.getRegisterData().setEmail(request.getEmail());

            // 4. Đăng ký User + Profile (chỉ thực hiện khi tất cả validation OK)
            User user = registerService.registerStudent(request.getRegisterData());

            // 5. Thiết lập mật khẩu và kích hoạt
            registerService.setupFinalPassword(request.getEmail(), request.getPassword());

            // 6. Tạo token
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

            return ResponseEntity.ok(new AuthResponse(token, "Đăng ký học viên thành công!"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, "Đăng ký thất bại: " + e.getMessage()));
        }
    }

    // ====================== VERIFY + REGISTER TUTOR ======================
    @PostMapping("/verify/tutor")
    public ResponseEntity<AuthResponse> verifyOtpAndRegisterTutor(@RequestBody VerifyOtpAndRegisterTutorRequest request) {
        try {
            // 1. Kiểm tra OTP
            boolean isValidOtp = otpService.verifyOtp(request.getEmail(), request.getOtp());
            if (!isValidOtp) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mã OTP không đúng hoặc đã hết hạn!"));
            }

            // 2. Kiểm tra mật khẩu
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mật khẩu không được để trống!"));
            }

            if (request.getConfirmPassword() == null || request.getConfirmPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Vui lòng xác nhận mật khẩu!"));
            }

            if (!request.getPassword().equals(request.getConfirmPassword())) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mật khẩu và xác nhận mật khẩu không khớp!"));
            }

            if (request.getPassword().length() < 6) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Mật khẩu phải có ít nhất 6 ký tự!"));
            }

            // 3. KIỂM TRA VÀ ĐỒNG BỘ EMAIL (RẤT QUAN TRỌNG - Đây là lỗi hiện tại)
            if (request.getRegisterData() == null) {
                return ResponseEntity.badRequest()
                        .body(new AuthResponse(null, "Dữ liệu đăng ký không được để trống!"));
            }

            // ←←← THÊM DÒNG NÀY ←←←
            request.getRegisterData().setEmail(request.getEmail());

            // 4. Đăng ký thông tin Gia sư
            User user = registerService.registerTutor(request.getRegisterData());

            // 5. Thiết lập mật khẩu và kích hoạt tài khoản
            registerService.setupFinalPassword(request.getEmail(), request.getPassword());

            // 6. Tạo JWT token
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

            return ResponseEntity.ok(new AuthResponse(token, "Đăng ký gia sư thành công!"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, "Đăng ký thất bại: " + e.getMessage()));
        }
    }

    private boolean isValidEmail(String email) {
        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        return email != null && email.matches(emailRegex);
    }
    // ==================== QUÊN MẬT KHẨU - GỬI OTP ====================
    @PostMapping("/forgot-password/send")
    public ResponseEntity<AuthResponse> forgotPasswordSendOtp(@RequestBody ForgotPasswordRequest request) {
        try {
            AuthResponse response = authService.forgotPassword(request);
            String otp = otpService.generateOtp(request.getEmail());
            emailService.sendOtpEmail(request.getEmail(), otp);

            return ResponseEntity.ok(new AuthResponse(null,
                    "Mã OTP để đặt lại mật khẩu đã được gửi đến email của bạn."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, e.getMessage()));
        }
    }

    // ==================== QUÊN MẬT KHẨU - ĐẶT LẠI MẬT KHẨU ====================
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<AuthResponse> forgotPasswordReset(@RequestBody ResetPasswordRequest request) {
        try {
            AuthResponse response = authService.resetPassword(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, e.getMessage()));
        }
    }
}