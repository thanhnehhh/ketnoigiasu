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

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final SubjectRepository subjectRepository;
    private final SessionService sessionService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    @Transactional
    public CourseResponse createCourse(String email, CourseRequest request) { // Đổi Course -> CourseResponse
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // KIỂM TRA PHÍ SÀN TRƯỚC KHI TẠO
        if (!paymentService.hasPaidPlatformFee(user.getId())) {
            notificationService.createNotification(user,
                    "Bạn chưa thể tạo khóa học. Vui lòng hoàn tất thanh toán phí sàn theo hợp đồng và đợi Admin duyệt.");
            throw new RuntimeException("Yêu cầu thanh toán phí sàn chưa được duyệt hoặc chưa thanh toán.");
        }

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

        Course savedCourse = courseRepository.save(course);

        // Thông báo cho gia sư
        notificationService.createNotification(user, "Khóa học '" + savedCourse.getTitle() + "' đã được tạo thành công và đang chờ Admin duyệt nội dung.");

        return mapToResponse(savedCourse); // Trả về DTO thay vì Entity
    }

    // Các hàm search, getCourses, approveCourse... giữ nguyên như cũ
    public List<CourseResponse> getCoursesByTutorEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return courseRepository.findByTutorUserId(user.getId()).stream().map(this::mapToResponse).toList();
    }

    public List<CourseResponse> searchCourses(String keyword, String subject, Double minPrice, Double maxPrice) {
        Specification<Course> spec = Specification.where((root, query, cb) -> cb.conjunction());
        spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), CourseStatus.APPROVED));
        if (keyword != null && !keyword.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"));
        }
        if (subject != null && !subject.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("subject").get("name"), subject));
        }
        if (minPrice != null) spec = spec.and((root, query, cb) -> cb.ge(root.get("pricePerSession"), minPrice));
        if (maxPrice != null) spec = spec.and((root, query, cb) -> cb.le(root.get("pricePerSession"), maxPrice));

        return courseRepository.findAll(spec).stream().map(this::mapToResponse).toList();
    }

    private CourseResponse mapToResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .subjectName(course.getSubject() != null ? course.getSubject().getName() : "N/A")
                .tutorName(course.getTutor().getUser().getFullName())
                .pricePerSession(course.getPricePerSession())
                .totalSessions(course.getTotalSessions())
                .status(course.getStatus().name())
                .isPromoted(course.isPromoted())
                .createdAt(course.getCreatedAt())
                .build();
    }

    @Transactional
    public CourseResponse approveCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        course.setStatus(CourseStatus.APPROVED);
        Course savedCourse = courseRepository.save(course);
        sessionService.initializeSessions(savedCourse);

        // Thông báo cho gia sư khi khóa học được lên sàn
        notificationService.createNotification(savedCourse.getTutor().getUser(),
                "Khóa học '" + savedCourse.getTitle() + "' đã được Admin phê duyệt và hiển thị trên hệ thống!");

        return mapToResponse(savedCourse);
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

    // 3. Hàm từ chối khóa học
    @Transactional
    public CourseResponse rejectCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));

        course.setStatus(CourseStatus.REJECTED);
        Course savedCourse = courseRepository.save(course);

        // Thông báo cho gia sư biết khóa học bị từ chối
        notificationService.createNotification(savedCourse.getTutor().getUser(),
                "Rất tiếc, khóa học '" + savedCourse.getTitle() + "' đã bị từ chối nội dung. Vui lòng kiểm tra lại.");

        return mapToResponse(savedCourse);
    }
}