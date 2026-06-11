package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TutorProfileRepository tutorProfileRepository;

    /** Lấy toàn bộ user */
    @GetMapping
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> role == null || role.isEmpty() || u.getRole().name().equalsIgnoreCase(role))
                .filter(u -> {
                    if (keyword == null || keyword.isEmpty()) return true;
                    String kw = keyword.toLowerCase();
                    return u.getFullName().toLowerCase().contains(kw)
                            || u.getEmail().toLowerCase().contains(kw);
                })
                .toList();
        return ResponseEntity.ok(users.stream().map(u -> Map.of(
                "id",        u.getId(),
                "email",     u.getEmail(),
                "fullName",  u.getFullName(),
                "role",      u.getRole().name(),
                "phone",     u.getPhone() != null ? u.getPhone() : "",
                "enabled",   u.isEnabled(),
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        )).toList());
    }

    /** Lấy danh sách hồ sơ gia sư chờ duyệt */
    @GetMapping("/tutor-verifications")
    public ResponseEntity<?> getTutorVerifications(
            @RequestParam(required = false, defaultValue = "PENDING") String status) {
        return ResponseEntity.ok(
            tutorProfileRepository.findAllByVerificationStatus(status).stream()
                .map(t -> Map.of(
                    "tutorProfileId",       t.getId(),
                    "fullName",             t.getUser().getFullName(),
                    "email",                t.getUser().getEmail(),
                    "school",               t.getSchool() != null ? t.getSchool() : "",
                    "major",                t.getMajor() != null ? t.getMajor() : "",
                    "strengths",            t.getStrengths() != null ? t.getStrengths() : "",
                    "qualificationImageUrl", t.getQualificationImageUrl() != null ? t.getQualificationImageUrl() : "",
                    "verificationNote",     t.getVerificationNote() != null ? t.getVerificationNote() : "",
                    "verificationStatus",   t.getVerificationStatus()
                )).toList()
        );
    }

    /** Admin duyệt hoặc từ chối hồ sơ gia sư */
    @PutMapping("/tutor-verifications/{tutorProfileId}")
    public ResponseEntity<?> reviewTutorProfile(
            @PathVariable Long tutorProfileId,
            @RequestParam String action, // APPROVED | REJECTED
            @RequestParam(required = false) String reason) {

        TutorProfile tutor = tutorProfileRepository.findById(tutorProfileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ gia sư"));

        tutor.setVerificationStatus(action);
        if (reason != null && !reason.isBlank()) tutor.setVerificationNote(reason);
        tutorProfileRepository.save(tutor);

        if ("APPROVED".equals(action)) {
            notificationService.createNotification(tutor.getUser(),
                    "✅ Hồ sơ gia sư của bạn đã được Admin duyệt! Bạn có thể tạo khóa học ngay bây giờ.",
                    "/tutor?tab=courses");
        } else {
            String msg = "❌ Hồ sơ gia sư bị từ chối" + (reason != null ? ". Lý do: " + reason : "") + ". Vui lòng cập nhật và nộp lại.";
            notificationService.createNotification(tutor.getUser(), msg, "/profile");
        }

        return ResponseEntity.ok(Map.of("status", action, "message", "APPROVED".equals(action) ? "Đã duyệt hồ sơ" : "Đã từ chối hồ sơ"));
    }

    /** Khóa / mở khóa tài khoản */
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        String msg = user.isEnabled()
                ? "✅ Tài khoản của bạn đã được mở khóa bởi Admin."
                : "⚠️ Tài khoản của bạn đã bị khóa bởi Admin.";
        notificationService.createNotification(user, msg, "/");
        return ResponseEntity.ok(Map.of("enabled", user.isEnabled(),
                "message", user.isEnabled() ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản"));
    }

    /** Disable tài khoản */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> disableUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        user.setEnabled(false);
        userRepository.save(user);
        return ResponseEntity.ok("Đã vô hiệu hóa tài khoản.");
    }
}
