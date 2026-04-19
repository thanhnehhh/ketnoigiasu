package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.LoginRequest;
import com.thanh.ketnoigiasubackend.dto.request.RegisterStudentRequest;
import com.thanh.ketnoigiasubackend.dto.request.RegisterTutorRequest;
import com.thanh.ketnoigiasubackend.dto.response.AuthResponse;
import com.thanh.ketnoigiasubackend.dto.response.UserResponse;
import com.thanh.ketnoigiasubackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/student/complete")
    public ResponseEntity<AuthResponse> completeStudentRegistration(@RequestBody RegisterStudentRequest request) {
        AuthResponse response = authService.completeStudentRegistration(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/tutor/complete")
    public ResponseEntity<AuthResponse> completeTutorRegistration(@RequestBody RegisterTutorRequest request) {
        AuthResponse response = authService.completeTutorRegistration(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserResponse userResponse = authService.getCurrentUser(email);
        return ResponseEntity.ok(userResponse);
    }
}