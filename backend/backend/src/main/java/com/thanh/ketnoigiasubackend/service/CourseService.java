package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.CourseRequest;
import com.thanh.ketnoigiasubackend.dto.response.CourseResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.CourseStatus;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
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
    private final ReviewRepository reviewRepository;
    private final CourseRegistrationRepository registrationRepository;

    @Transactional
    public CourseResponse createCourse(String email, CourseRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!paymentService.hasPaidPlatformFee(user.getId())) {
            notificationService.createNotification(user,
                    "Bạn chưa thể tạo khóa học. Vui lòng hoàn tất thanh toán phí sàn.",
                    "/tutor/contracts");
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
                .teachingMode(request.getTeachingMode() != null ? request.getTeachingMode() : "BOTH")
                .build();

        Course savedCourse = courseRepository.save(course);
        notificationService.createNotification(user,
                "Khóa học '" + savedCourse.getTitle() + "' đã tạo, đang chờ Admin duyệt.",
                "/tutor");
        return mapToResponse(savedCourse);
    }

    public List<CourseResponse> getCoursesByTutorEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return courseRepository.findByTutorUserId(user.getId())
                .stream().map(this::mapToResponse).toList();
    }

    public List<CourseResponse> searchCourses(String keyword, String subject, Double minPrice, Double maxPrice, String grade, String teachingMode, String province) {
        Specification<Course> spec = (root, query, cb) -> cb.equal(root.get("status"), CourseStatus.APPROVED);

        if (keyword != null && !keyword.isEmpty())
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"));
        if (subject != null && !subject.isEmpty())
            spec = spec.and((root, query, cb) -> cb.equal(root.get("subject").get("name"), subject));
        if (minPrice != null)
            spec = spec.and((root, query, cb) -> cb.ge(root.get("pricePerSession"), minPrice));
        if (maxPrice != null)
            spec = spec.and((root, query, cb) -> cb.le(root.get("pricePerSession"), maxPrice));
        if (grade != null && !grade.isEmpty())
            spec = spec.and((root, query, cb) -> cb.like(root.get("tutor").get("grades"), "%" + grade + "%"));
        if (teachingMode != null && !teachingMode.isEmpty() && !teachingMode.equals("ALL"))
            spec = spec.and((root, query, cb) -> cb.or(
                cb.equal(root.get("teachingMode"), teachingMode),
                cb.equal(root.get("teachingMode"), "BOTH")
            ));

        // Lọc theo tỉnh thành — tìm trong địa chỉ gia sư
        // province param truyền vào là tên tỉnh, ví dụ "Hà Nội", "TP. Hồ Chí Minh"
        if (province != null && !province.isEmpty())
            spec = spec.and((root, query, cb) ->
                cb.like(cb.lower(root.get("tutor").get("address")), "%" + province.toLowerCase() + "%"));

        List<CourseResponse> results = courseRepository.findAll(spec)
                .stream().map(this::mapToResponse).toList();

        return results.stream()
                .sorted(Comparator.comparingDouble(CourseResponse::getScore).reversed())
                .toList();
    }

    @Transactional
    public CourseResponse approveCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        course.setStatus(CourseStatus.APPROVED);
        Course savedCourse = courseRepository.save(course);
        sessionService.initializeSessions(savedCourse);
        // Thông báo gia sư → link đến tab khóa học
        notificationService.createNotification(savedCourse.getTutor().getUser(),
                "✅ Khóa học '" + savedCourse.getTitle() + "' đã được duyệt và hiển thị trên hệ thống!",
                "/tutor");
        return mapToResponse(savedCourse);
    }

    @Transactional
    public CourseResponse rejectCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        course.setStatus(CourseStatus.REJECTED);
        Course savedCourse = courseRepository.save(course);
        notificationService.createNotification(savedCourse.getTutor().getUser(),
                "❌ Khóa học '" + savedCourse.getTitle() + "' bị từ chối. Vui lòng kiểm tra lại nội dung.",
                "/tutor");
        return mapToResponse(savedCourse);
    }

    @Transactional
    public CourseResponse updateCourse(Long courseId, String email, CourseRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        if (!course.getTutor().getUser().getId().equals(user.getId()))
            throw new RuntimeException("Bạn không có quyền sửa khóa học của người khác!");
        if (request.getTitle() != null) course.setTitle(request.getTitle());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getPricePerSession() != null) course.setPricePerSession(request.getPricePerSession());
        if (request.getTotalSessions() != null) course.setTotalSessions(request.getTotalSessions());
        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học"));
            course.setSubject(subject);
        }
        if (request.getTeachingMode() != null) course.setTeachingMode(request.getTeachingMode());
        course.setStatus(CourseStatus.PENDING_APPROVE);
        return mapToResponse(courseRepository.save(course));
    }

    public List<CourseResponse> getCoursesByStatusForAdmin(CourseStatus status) {
        return courseRepository.findAll().stream().filter(c -> c.getStatus() == status).map(this::mapToResponse).toList();
    }

    public List<CourseResponse> getAllCoursesForAdmin() {
        return courseRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void expirePromotions() {
        List<Course> expiredCourses = courseRepository.findAll().stream()
                .filter(c -> c.isPromoted() && c.getPromotionExpiration() != null
                        && LocalDateTime.now().isAfter(c.getPromotionExpiration()))
                .toList();
        for (Course course : expiredCourses) {
            course.setPromoted(false);
            course.setPromotionExpiration(null);
            notificationService.createNotification(course.getTutor().getUser(),
                    "Gói đẩy tin cho khóa học '" + course.getTitle() + "' đã hết hạn.",
                    "/tutor");
        }
        if (!expiredCourses.isEmpty()) courseRepository.saveAll(expiredCourses);
    }

    private double calculateScore(Course course, Double avgRating, long totalRegistrations) {
        double ratingScore = (avgRating != null ? avgRating : 0.0) * 150.0;
        double popularityScore = totalRegistrations * 8.0;
        long daysSinceCreated = course.getCreatedAt() != null
                ? ChronoUnit.DAYS.between(course.getCreatedAt(), LocalDateTime.now()) : 0;
        double promotedBonus = course.isPromoted() ? 500.0 : 0.0;
        return ratingScore + popularityScore - daysSinceCreated * 0.3 + promotedBonus;
    }

    private CourseResponse mapToResponse(Course course) {
        Double avgRating = reviewRepository.getAvgRatingByCourseId(course.getId());
        // Chỉ đếm học viên đang học (ACTIVE) — không đếm PENDING/REJECTED/COMPLETED
        long totalRegistrations = registrationRepository.countByCourseIdAndStatus(course.getId(), "ACTIVE");
        // Lớp đầy khi có học viên APPROVED (chờ thanh toán) hoặc ACTIVE (đang học)
        long approvedCount = registrationRepository.findByCourseId(course.getId()).stream()
                .filter(r -> "APPROVED".equals(r.getStatus()) || "ACTIVE".equals(r.getStatus()))
                .count();
        double score = calculateScore(course, avgRating, totalRegistrations);
        return CourseResponse.builder()
                .id(course.getId()).title(course.getTitle()).description(course.getDescription())
                .subjectName(course.getSubject() != null ? course.getSubject().getName() : "N/A")
                .tutorName(course.getTutor().getUser().getFullName())
                .tutorProfileId(course.getTutor().getId())
                .pricePerSession(course.getPricePerSession()).totalSessions(course.getTotalSessions())
                .status(course.getStatus().name()).isPromoted(course.isPromoted())
                .promotionExpiration(course.getPromotionExpiration()).createdAt(course.getCreatedAt())
                .avgRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .registrationCount((int) totalRegistrations)
                .score(Math.round(score * 10.0) / 10.0)
                .teachingMode(course.getTeachingMode() != null ? course.getTeachingMode() : "BOTH")
                .hasApprovedStudent(approvedCount > 0)
                .build();
    }
}
