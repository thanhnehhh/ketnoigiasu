package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.entity.CourseRegistration;
import com.thanh.ketnoigiasubackend.repository.CourseRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseRegistrationService {

    private final CourseRegistrationRepository registrationRepository;

    // Gia sư xem danh sách đứa nào đăng ký lớp mình
    public List<CourseRegistration> getApplicationsForTutor(Long tutorUserId) {
        return registrationRepository.findByCourseTutorUserId(tutorUserId);
    }

    // Logic Duyệt/Từ chối
    @Transactional
    public CourseRegistration updateStatus(Long registrationId, String status, String email) {
        CourseRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đăng ký"));

        // Bảo mật: Chỉ chủ khóa học mới được duyệt
        if (!reg.getCourse().getTutor().getUser().getEmail().equals(email)) {
            throw new RuntimeException("Bạn không có quyền duyệt hồ sơ này!");
        }

        reg.setStatus(status);
        return registrationRepository.save(reg);
    }
}