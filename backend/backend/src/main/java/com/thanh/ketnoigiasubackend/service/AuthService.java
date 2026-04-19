package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.LoginRequest;
import com.thanh.ketnoigiasubackend.dto.request.RegisterStudentRequest;
import com.thanh.ketnoigiasubackend.dto.request.RegisterTutorRequest;
import com.thanh.ketnoigiasubackend.dto.response.AuthResponse;
import com.thanh.ketnoigiasubackend.dto.response.UserResponse;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RegisterService registerService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return new AuthResponse(token, "Đăng nhập thành công!");
    }

    public AuthResponse completeStudentRegistration(RegisterStudentRequest request) {
        User user = registerService.registerStudent(request);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return new AuthResponse(token, "Đăng ký học viên thành công!");
    }

    public AuthResponse completeTutorRegistration(RegisterTutorRequest request) {
        User user = registerService.registerTutor(request);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return new AuthResponse(token, "Đăng ký gia sư thành công!");
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().name()
        );
    }
}