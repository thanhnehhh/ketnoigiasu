package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.CourseRequest;
import com.thanh.ketnoigiasubackend.dto.response.CourseResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.CourseStatus;
import com.thanh.ketnoigiasubackend.enums.PaymentStatus;
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
    private final PaymentRepository paymentRepository;

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

        // Kiểm tra hồ sơ đã được Admin duyệt chưa
        if (!"APPROVED".equals(tutor.getVerificationStatus())) {
            throw new RuntimeException("Hồ sơ gia sư chưa được Admin duyệt. Vui lòng nộp hồ sơ xét duyệt trước.");
        }

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .pricePerSession(request.getPricePerSession())
                .totalSessions(request.getTotalSessions())
                .tutor(tutor)
                .subject(subject)
                .status(CourseStatus.APPROVED) // Hồ sơ đã duyệt → khóa học tự động APPROVED
                .isPromoted(false)
                .teachingMode(request.getTeachingMode() != null ? request.getTeachingMode() : "BOTH")
                .schedule(request.getSchedule())
                .build();

        Course savedCourse = courseRepository.save(course);
        sessionService.initializeSessions(savedCourse); // Tạo buổi học ngay
        notificationService.createNotification(user,
                "✅ Khóa học '" + savedCourse.getTitle() + "' đã được tạo và hiển thị ngay trên hệ thống.",
                "/tutor?tab=courses");
        return mapToResponse(savedCourse);
    }

    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        return mapToResponse(course);
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
                .filter(c -> !c.isHasApprovedStudent()) // ẩn khóa đang có học viên ACTIVE hoặc APPROVED còn hạn
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
                "/tutor?tab=courses");
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
                "/tutor?tab=courses");
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
        if (request.getSchedule() != null) course.setSchedule(request.getSchedule());

        // Giữ nguyên status — không cần Admin duyệt lại khi gia sư sửa thông tin
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
        // 1. Hết hạn đẩy tin
        List<Course> expiredCourses = courseRepository.findAll().stream()
                .filter(c -> c.isPromoted() && c.getPromotionExpiration() != null
                        && LocalDateTime.now().isAfter(c.getPromotionExpiration()))
                .toList();
        for (Course course : expiredCourses) {
            course.setPromoted(false);
            course.setPromotionExpiration(null);
            notificationService.createNotification(course.getTutor().getUser(),
                    "Gói đẩy tin cho khóa học '" + course.getTitle() + "' đã hết hạn.",
                    "/tutor?tab=courses");
        }
        if (!expiredCourses.isEmpty()) courseRepository.saveAll(expiredCourses);

        // 2. Tự động hủy đăng ký APPROVED mà học viên chưa thanh toán sau 24h
        registrationRepository.findAll().stream()
                .filter(r -> "APPROVED".equals(r.getStatus()))
                .forEach(r -> {
                    boolean invoiceExpired = paymentRepository
                            .findByUserIdOrderByCreatedAtDesc(r.getStudent().getUser().getId())
                            .stream()
                            .anyMatch(p -> "TUITION_FEE".equals(p.getPaymentType())
                                    && p.getRegistration() != null
                                    && p.getRegistration().getId().equals(r.getId())
                                    && p.getStatus() == PaymentStatus.PENDING
                                    && p.getExpiresAt() != null
                                    && LocalDateTime.now().isAfter(p.getExpiresAt()));
                    if (invoiceExpired) {
                        r.setStatus("REJECTED");
                        registrationRepository.save(r);
                        notificationService.createNotification(r.getStudent().getUser(),
                                "⏰ Hóa đơn học phí lớp '" + r.getCourse().getTitle() +
                                "' đã hết hạn 24 giờ. Đăng ký đã bị hủy. Bạn có thể đăng ký lại.",
                                "/student?tab=payments");
                        notificationService.createNotification(r.getCourse().getTutor().getUser(),
                                "⏰ Học viên " + r.getStudent().getUser().getFullName() +
                                " chưa thanh toán sau 24h. Đăng ký lớp '" + r.getCourse().getTitle() +
                                "' đã tự động hủy. Khóa học đã mở lại.",
                                "/tutor?tab=applications");
                    }
                });
    }

    /** Kiểm tra đăng ký APPROVED có hóa đơn đã hết hạn không */
    private boolean isRegistrationInvoiceExpired(CourseRegistration reg) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(reg.getStudent().getUser().getId())
                .stream()
                .anyMatch(p -> "TUITION_FEE".equals(p.getPaymentType())
                        && p.getRegistration() != null
                        && p.getRegistration().getId().equals(reg.getId())
                        && p.getStatus() == PaymentStatus.PENDING
                        && p.getExpiresAt() != null
                        && LocalDateTime.now().isAfter(p.getExpiresAt()));
    }

    private double calculateScore(Course course, Double avgRating, long totalRegistrations) {
        double ratingScore      = (avgRating != null ? avgRating : 0.0) * 150.0;
        double popularityScore  = totalRegistrations * 8.0;
        long daysSinceCreated   = course.getCreatedAt() != null
                ? ChronoUnit.DAYS.between(course.getCreatedAt(), LocalDateTime.now()) : 0;

        // Đẩy tin: luôn lên đầu (bonus 800 >> mọi yếu tố khác)
        double promotedBonus = course.isPromoted() ? 800.0 : 0.0;

        // Điểm uy tín gia sư: tầng thứ 2 (max 100 * 4 = 400 — không thắng promoted)
        int reputationScore = course.getTutor().getReputationScore();
        double reputationBonus = reputationScore * 4.0;

        return promotedBonus + reputationBonus + ratingScore + popularityScore - daysSinceCreated * 0.3;
    }

    private CourseResponse mapToResponse(Course course) {
        Double avgRating = reviewRepository.getAvgRatingByCourseId(course.getId());
        // Chỉ đếm học viên đang học (ACTIVE) — không đếm PENDING/REJECTED/COMPLETED
        long totalRegistrations = registrationRepository.countByCourseIdAndStatus(course.getId(), "ACTIVE");
        // Lớp đầy / đã được dạy khi có học viên ACTIVE, APPROVED còn hạn, hoặc COMPLETED
        long approvedCount = registrationRepository.findByCourseId(course.getId()).stream()
                .filter(r -> "ACTIVE".equals(r.getStatus())
                        || "COMPLETED".equals(r.getStatus())
                        || ("APPROVED".equals(r.getStatus()) && !isRegistrationInvoiceExpired(r)))
                .count();
        double score = calculateScore(course, avgRating, totalRegistrations);
        return CourseResponse.builder()
                .id(course.getId()).title(course.getTitle()).description(course.getDescription())
                .subjectName(course.getSubject() != null ? course.getSubject().getName() : "N/A")
                .subjectId(course.getSubject() != null ? course.getSubject().getId() : null)
                .tutorName(course.getTutor().getUser().getFullName())
                .tutorProfileId(course.getTutor().getId())
                .tutorAddress(course.getTutor().getAddress())
                .pricePerSession(course.getPricePerSession()).totalSessions(course.getTotalSessions())
                .status(course.getStatus().name()).isPromoted(course.isPromoted())
                .promotionExpiration(course.getPromotionExpiration()).createdAt(course.getCreatedAt())
                .avgRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .registrationCount((int) totalRegistrations)
                .score(Math.round(score * 10.0) / 10.0)
                .teachingMode(course.getTeachingMode() != null ? course.getTeachingMode() : "BOTH")
                .hasApprovedStudent(approvedCount > 0)
                .schedule(course.getSchedule())
                .build();
    }
}
