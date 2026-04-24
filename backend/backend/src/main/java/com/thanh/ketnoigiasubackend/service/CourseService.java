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
import org.springframework.data.jpa.domain.Specification;
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
                .status(CourseStatus.PENDING_APPROVE)
                .isPromoted(false)
                .build();

        return courseRepository.save(course);
    }

    public List<CourseResponse> getCoursesByTutorEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Course> courses = courseRepository.findByTutorUserId(user.getId());

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

    public List<CourseResponse> searchCourses(String keyword, String subject, Double minPrice, Double maxPrice) {
        Specification<Course> spec = Specification.where((root, query, cb) -> cb.conjunction());

        spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), CourseStatus.APPROVED));
        if (keyword != null && !keyword.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"));
        }
        if (subject != null && !subject.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("subject").get("name"), subject));
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) -> cb.ge(root.get("pricePerSession"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) -> cb.le(root.get("pricePerSession"), maxPrice));
        }

        return courseRepository.findAll(spec).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .subjectName(course.getSubject().getName())
                .tutorName(course.getTutor().getUser().getFullName())
                .pricePerSession(course.getPricePerSession())
                .totalSessions(course.getTotalSessions())
                .status(course.getStatus().toString())
                .isPromoted(course.isPromoted())
                .build();
    }

    // 1. Lấy khóa học theo trạng thái cho Admin
    public List<CourseResponse> getCoursesByStatusForAdmin(CourseStatus status) {
        return courseRepository.findAll().stream()
                .filter(c -> c.getStatus() == status)
                .map(this::mapToResponse)
                .toList();
    }

    // 2. Lấy tất cả khóa học để Admin thống kê
    public List<CourseResponse> getAllCoursesForAdmin() {
        return courseRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    // 3. Hàm duyệt khóa học
    @Transactional
    public CourseResponse approveCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        course.setStatus(CourseStatus.APPROVED);
        return mapToResponse(courseRepository.save(course));
    }

    // 4. Hàm từ chối khóa học
    @Transactional
    public CourseResponse rejectCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        course.setStatus(CourseStatus.REJECTED);
        return mapToResponse(courseRepository.save(course));
    }
}