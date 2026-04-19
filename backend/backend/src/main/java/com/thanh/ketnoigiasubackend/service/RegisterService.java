package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.RegisterStudentRequest;
import com.thanh.ketnoigiasubackend.dto.request.RegisterTutorRequest;
import com.thanh.ketnoigiasubackend.entity.StudentProfile;
import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.enums.Role;
import com.thanh.ketnoigiasubackend.repository.StudentProfileRepository;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RegisterService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerStudent(RegisterStudentRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.STUDENT)
                .password("")
                .enabled(false)
                .build();

        User savedUser = userRepository.save(user);

        StudentProfile profile = StudentProfile.builder()
                .user(savedUser)
                .address(request.getAddress())
                .gradeLevel(request.getGradeLevel())
                .learningGoals(request.getLearningGoals())
                .build();

        studentProfileRepository.save(profile);
        return savedUser;
    }

    @Transactional
    public User registerTutor(RegisterTutorRequest request) {
        // 1. Tạo User với mật khẩu rỗng và enabled = false
        User user = User.builder()
                .email(request.getEmail())
                .password("") // Để trống để nạp sau ở bước create-password
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.TUTOR)
                .enabled(false)
                .build();

        User savedUser = userRepository.save(user);

        // 2. Chuyển đổi List từ Request sang String để lưu vào DB (Khớp Entity của bạn)
        String subjectsStr = (request.getSubjects() != null) ? String.join(", ", request.getSubjects()) : "";
        String gradesStr = (request.getGrades() != null) ? String.join(", ", request.getGrades()) : "";

        // 3. Tạo Profile
        TutorProfile profile = TutorProfile.builder()
                .user(savedUser)
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .cccd(request.getCccd())
                .cccdIssuedPlace(request.getCccdIssuedPlace())
                .address(request.getAddress())
                .school(request.getSchool())
                .major(request.getMajor())
                .graduationYear(request.getGraduationYear())
                .currentOccupation(request.getCurrentOccupation())
                .strengths(request.getStrengths())
                .subjects(subjectsStr)
                .grades(gradesStr)
                .build();

        tutorProfileRepository.save(profile);
        return savedUser;
    }

    @Transactional
    public void setupFinalPassword(String email, String password) {
        if (password == null || password.length() < 6 || !password.matches(".*[!@#$%^&*()].*")) {
            throw new RuntimeException("Mật khẩu không đạt yêu cầu bảo mật!");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // 2. Mã hóa mật khẩu thật và kích hoạt tài khoản
        user.setPassword(passwordEncoder.encode(password));
        user.setEnabled(true);
        userRepository.save(user);
    }
}