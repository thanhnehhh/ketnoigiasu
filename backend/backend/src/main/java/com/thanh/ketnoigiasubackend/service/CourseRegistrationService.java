package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.RegistrationResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseRegistrationService {

    private final CourseRegistrationRepository registrationRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;

    @Transactional
    public RegistrationResponse registerCourse(Long courseId, String studentEmail, String notes) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Bạn cần cập nhật hồ sơ Học viên trước!"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Khóa học không tồn tại"));

        if (!"APPROVED".equals(course.getStatus().name())) {
            throw new RuntimeException("Khóa học này hiện chưa được kiểm duyệt, vui lòng quay lại sau!");
        }

        boolean exists = registrationRepository.findByStudentUserId(user.getId()).stream()
                .anyMatch(r -> r.getCourse().getId().equals(courseId));
        if (exists) throw new RuntimeException("Bạn đã đăng ký khóa học này rồi!");

        CourseRegistration reg = CourseRegistration.builder()
                .course(course)
                .student(student)
                .notes(notes)
                .status("PENDING")
                .build();

        return mapToResponse(registrationRepository.save(reg));
    }

    // 2. Student xem danh sách mình đã đăng ký
    public List<RegistrationResponse> getRegistrationsForStudent(Long studentUserId) {
        return registrationRepository.findByStudentUserId(studentUserId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // 3. Tutor xem danh sách đơn xin học
    public List<RegistrationResponse> getApplicationsForTutor(Long tutorUserId) {
        return registrationRepository.findByCourseTutorUserId(tutorUserId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // 4. Logic Duyệt/Từ chối (Cập nhật trả về DTO)
    @Transactional
    public RegistrationResponse updateStatus(Long registrationId, String status, String email) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đăng ký"));

        if (!reg.getCourse().getTutor().getUser().getEmail().equals(email)) {
            throw new RuntimeException("Bạn không có quyền duyệt hồ sơ này!");
        }

        reg.setStatus(status);
        return mapToResponse(registrationRepository.save(reg));
    }

    // Hàm phụ để map Entity -> DTO
    private RegistrationResponse mapToResponse(CourseRegistration reg) {
        return RegistrationResponse.builder()
                .id(reg.getId())
                .courseId(reg.getCourse().getId())
                .courseTitle(reg.getCourse().getTitle())
                .tutorName(reg.getCourse().getTutor().getUser().getFullName())
                .studentName(reg.getStudent().getUser().getFullName())
                .status(reg.getStatus())
                .notes(reg.getNotes())
                .pricePerSession(reg.getCourse().getPricePerSession())
                .appliedAt(reg.getAppliedAt())
                .build();
    }
}