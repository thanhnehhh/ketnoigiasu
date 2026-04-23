package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.CourseRequest;
import com.thanh.ketnoigiasubackend.dto.response.CourseResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.CourseStatus;
import com.thanh.ketnoigiasubackend.repository.CourseRepository;
import com.thanh.ketnoigiasubackend.repository.SubjectRepository;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final SubjectRepository subjectRepository;

    @Transactional
    public Course createCourse(String email, CourseRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TutorProfile tutor = tutorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Tutor profile not found"));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .pricePerSession(request.getPricePerSession())
                .totalSessions(request.getTotalSessions())
                .tutor(tutor)
                .subject(subject)
                .status(CourseStatus.PENDING_APPROVE) // Đảm bảo set status ở đây
                .isPromoted(false) // Mặc định là false
                .build();

        return courseRepository.save(course);
    }
    public List<CourseResponse> getCoursesByTutorEmail(String email) {
        // 1. Phải tìm User từ email trước để lấy ID
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Dùng ID của user để tìm danh sách khóa học
        List<Course> courses = courseRepository.findByTutorUserId(user.getId());

        // 3. Chuyển đổi (Map) từ Entity sang DTO
        return courses.stream().map(course -> CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .subjectName(course.getSubject() != null ? course.getSubject().getName() : "N/A")
                .tutorName(course.getTutor().getUser().getFullName())
                .pricePerSession(course.getPricePerSession())
                .totalSessions(course.getTotalSessions())
                .isPromoted(course.isPromoted())
                .status(course.getStatus().name())
                .build()
        ).toList();
    }
}