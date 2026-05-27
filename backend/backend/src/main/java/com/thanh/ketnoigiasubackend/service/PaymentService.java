package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.PaymentResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.PaymentStatus;import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final NotificationService notificationService;
    private final TutorProfileRepository tutorProfileRepository;

    @Transactional
    public PaymentResponse createPlatformFeeRequest(String email, String proofUrl) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        if (paymentRepository.existsByUserIdAndPaymentTypeAndStatus(user.getId(), "PLATFORM_FEE", PaymentStatus.PENDING_VERIFY))
            throw new RuntimeException("Bạn đã có yêu cầu phí sàn đang chờ duyệt.");
        if (hasPaidPlatformFee(user.getId()))
            throw new RuntimeException("Bạn đã thanh toán phí sàn thành công rồi.");

        Payment payment = Payment.builder().user(user).amount(200000.0)
                .paymentType("PLATFORM_FEE").proofImageUrl(proofUrl).status(PaymentStatus.PENDING_VERIFY).build();
        Payment saved = paymentRepository.save(payment);
        notificationService.createNotification(user,
                "💵 Yêu cầu phí sàn đã gửi. Vui lòng đợi Admin duyệt.", "/tutor");
        return mapToResponse(saved);
    }

    @Transactional
    public PaymentResponse createPromotionRequest(Long courseId, String email) {
        Course course = courseRepository.findById(courseId).orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        if (!course.getTutor().getUser().getId().equals(user.getId()))
            throw new RuntimeException("Bạn không có quyền đẩy tin khóa học này");
        if (paymentRepository.existsByCourseIdAndPaymentTypeAndStatus(courseId, "PROMOTE", PaymentStatus.PENDING_VERIFY))
            throw new RuntimeException("Khóa học này đang có yêu cầu đẩy tin chờ duyệt.");

        Payment payment = Payment.builder().user(user).course(course).amount(50000.0)
                .paymentType("PROMOTE").status(PaymentStatus.PENDING).build();
        Payment saved = paymentRepository.save(payment);
        notificationService.createNotification(user,
                "🔥 Yêu cầu đẩy tin cho '" + course.getTitle() + "' đã tạo. Nộp minh chứng 50.000đ (Mã HĐ: #" + saved.getId() + ").",
                "/tutor");
        return mapToResponse(saved);
    }

    public List<PaymentResponse> getAllPendingPayments() {
        return paymentRepository.findByStatus(PaymentStatus.PENDING_VERIFY).stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public PaymentResponse approvePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch"));
        if (payment.getStatus() == PaymentStatus.SUCCESS) throw new RuntimeException("Giao dịch này đã được duyệt rồi");

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setVerifiedAt(LocalDateTime.now());

        if ("PLATFORM_FEE".equals(payment.getPaymentType())) {
            notificationService.createNotification(payment.getUser(),
                    "✅ Phí sàn đã được duyệt! Bạn có thể tạo khóa học ngay.", "/tutor");

        } else if ("PROMOTE".equals(payment.getPaymentType()) && payment.getCourse() != null) {
            Course course = payment.getCourse();
            course.setPromoted(true);
            course.setPromotionExpiration(LocalDateTime.now().plusDays(7));
            courseRepository.save(course);
            notificationService.createNotification(payment.getUser(),
                    "🔥 Khóa học '" + course.getTitle() + "' đã được đẩy tin trong 7 ngày!", "/tutor");

        } else if ("TUITION_FEE".equals(payment.getPaymentType()) && payment.getRegistration() != null) {
            CourseRegistration reg = payment.getRegistration();
            reg.setStatus("ACTIVE");
            registrationRepository.save(reg);
            // Thông báo học viên → link đến lớp học
            notificationService.createNotification(payment.getUser(),
                    "✅ Học phí đã xác nhận! Lớp '" + reg.getCourse().getTitle() + "' đã bắt đầu. Chúc bạn học tốt!",
                    "/student/course/" + reg.getCourse().getId());
            // Thông báo gia sư → link đến quản lý lớp
            notificationService.createNotification(reg.getCourse().getTutor().getUser(),
                    "💰 " + reg.getStudent().getUser().getFullName() + " đã thanh toán học phí lớp '" + reg.getCourse().getTitle() + "'.",
                    "/tutor/course/" + reg.getCourse().getId());
        }

        return mapToResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse submitProof(Long paymentId, String proofImageUrl, String email) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn!"));
        if (payment.getExpiresAt() != null && LocalDateTime.now().isAfter(payment.getExpiresAt())) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Hóa đơn này đã quá hạn 24 giờ. Vui lòng đăng ký lại khóa học!");
        }
        if (!payment.getUser().getEmail().equals(email))
            throw new RuntimeException("Bạn không có quyền cập nhật hóa đơn này!");
        payment.setProofImageUrl(proofImageUrl);
        payment.setStatus(PaymentStatus.PENDING_VERIFY);
        return mapToResponse(paymentRepository.save(payment));
    }

    public List<PaymentResponse> getMyPayments(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::mapToResponse).toList();
    }

    /** Lấy danh sách học phí chưa chuyển tiền cho gia sư */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPendingTransferToTutor() {
        return paymentRepository.findPendingTransferToTutor()
                .stream().map(this::mapToResponse).toList();
    }

    /** Admin đánh dấu đã chuyển tiền cho gia sư */
    @Transactional
    public PaymentResponse markTransferredToTutor(Long paymentId, String transferProofUrl) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn"));
        if (!"TUITION_FEE".equals(payment.getPaymentType()))
            throw new RuntimeException("Chỉ áp dụng cho học phí");
        if (payment.isTransferredToTutor())
            throw new RuntimeException("Đã chuyển tiền cho gia sư rồi");

        payment.setTransferredToTutor(true);
        payment.setTransferredAt(LocalDateTime.now());
        payment.setTransferProofUrl(transferProofUrl);

        double netAmount = payment.getAmount() * 0.9;
        TutorProfile tutor = payment.getRegistration() != null
                ? payment.getRegistration().getCourse().getTutor()
                : payment.getCourse() != null ? payment.getCourse().getTutor() : null;

        if (tutor != null) {
            notificationService.createNotification(tutor.getUser(),
                    String.format("💰 Admin đã chuyển %.0fđ (sau khấu trừ 10%% phí sàn) cho khóa học '%s'.",
                            netAmount,
                            payment.getRegistration() != null
                                    ? payment.getRegistration().getCourse().getTitle()
                                    : payment.getCourse().getTitle()),
                    "/tutor/payments");
        }
        return mapToResponse(paymentRepository.save(payment));
    }

    /** Lịch sử đã chuyển tiền cho gia sư */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getTransferHistory() {
        return paymentRepository.findAll().stream()
                .filter(p -> "TUITION_FEE".equals(p.getPaymentType()) && p.isTransferredToTutor())
                .sorted((a, b) -> b.getTransferredAt().compareTo(a.getTransferredAt()))
                .map(this::mapToResponse)
                .toList();
    }

    /** Thống kê tài chính tổng quan cho Admin */
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminFinanceSummary() {
        List<Payment> allPayments = paymentRepository.findAll();

        double totalTuition = allPayments.stream()
                .filter(p -> "TUITION_FEE".equals(p.getPaymentType()) && p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount).sum();

        double totalPlatformFee = allPayments.stream()
                .filter(p -> "PLATFORM_FEE".equals(p.getPaymentType()) && p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount).sum();

        double totalPromote = allPayments.stream()
                .filter(p -> "PROMOTE".equals(p.getPaymentType()) && p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount).sum();

        // Phí % sàn thu được (10% học phí)
        double platformPercentFee = totalTuition * 0.1;

        long pendingCount = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING_VERIFY).count();

        Map<String, Object> result = new HashMap<>();
        result.put("totalTuition", totalTuition);
        result.put("totalPlatformFee", totalPlatformFee);
        result.put("totalPromote", totalPromote);
        result.put("platformPercentFee", platformPercentFee);
        result.put("totalRevenue", totalPlatformFee + totalPromote + platformPercentFee);
        result.put("pendingPaymentCount", pendingCount);
        return result;
    }

    public boolean hasPaidPlatformFee(Long userId) {
        return paymentRepository.existsByUserIdAndPaymentTypeAndStatus(userId, "PLATFORM_FEE", PaymentStatus.SUCCESS);
    }

    /** Tóm tắt tài chính cho gia sư */
    @Transactional(readOnly = true)
    public Map<String, Object> getTutorPaymentSummary(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        TutorProfile tutor = tutorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Tutor profile not found"));

        // Tổng doanh thu đã nhận (học phí học viên đã thanh toán thành công)
        Double totalIncome = paymentRepository.sumTuitionFeeByTutorProfileId(tutor.getId());
        if (totalIncome == null) totalIncome = 0.0;

        // Phí sàn
        boolean paidPlatformFee = hasPaidPlatformFee(user.getId());
        double platformFeeAmount = 200000.0;

        // Phí % sàn (10% doanh thu)
        double platformFeePercent = 10.0;
        double estimatedFee = totalIncome * platformFeePercent / 100;
        double netIncome = totalIncome - estimatedFee;

        // Thông tin tài khoản thụ hưởng
        Map<String, Object> result = new HashMap<>();
        result.put("totalIncome", totalIncome);
        result.put("platformFeePercent", platformFeePercent);
        result.put("estimatedFee", estimatedFee);
        result.put("netIncome", netIncome);
        result.put("paidPlatformFee", paidPlatformFee);
        result.put("platformFeeAmount", platformFeeAmount);
        result.put("bankName", tutor.getBankName());
        result.put("bankAccount", tutor.getBankAccount());
        result.put("bankOwner", tutor.getBankOwner());
        return result;
    }

    /** Lịch sử học phí học viên đã trả cho gia sư */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getTutorIncomeHistory(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        TutorProfile tutor = tutorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
        return paymentRepository.findTuitionFeesByTutorProfileId(tutor.getId())
                .stream().map(this::mapToResponse).toList();
    }

    /** Cập nhật thông tin tài khoản thụ hưởng */
    @Transactional
    public void updateBankInfo(String email, String bankName, String bankAccount, String bankOwner) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        TutorProfile tutor = tutorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
        tutor.setBankName(bankName);
        tutor.setBankAccount(bankAccount);
        tutor.setBankOwner(bankOwner);
        tutorProfileRepository.save(tutor);
    }

    private PaymentResponse mapToResponse(Payment payment) {
        // Lấy thông tin ngân hàng gia sư nếu là TUITION_FEE
        String tutorBankName = null, tutorBankAccount = null, tutorBankOwner = null;
        if ("TUITION_FEE".equals(payment.getPaymentType())) {
            TutorProfile tutor = null;
            if (payment.getRegistration() != null)
                tutor = payment.getRegistration().getCourse().getTutor();
            else if (payment.getCourse() != null)
                tutor = payment.getCourse().getTutor();
            if (tutor != null) {
                tutorBankName    = tutor.getBankName();
                tutorBankAccount = tutor.getBankAccount();
                tutorBankOwner   = tutor.getBankOwner();
            }
        }
        return PaymentResponse.builder()
                .id(payment.getId()).userFullName(payment.getUser().getFullName()).email(payment.getUser().getEmail())
                .amount(payment.getAmount()).paymentType(payment.getPaymentType()).status(payment.getStatus().name())
                .proofImageUrl(payment.getProofImageUrl()).createdAt(payment.getCreatedAt())
                .verifiedAt(payment.getVerifiedAt()).expiresAt(payment.getExpiresAt())
                .courseId(payment.getCourse() != null ? payment.getCourse().getId() : null)
                .courseTitle(payment.getCourse() != null ? payment.getCourse().getTitle() :
                        (payment.getRegistration() != null ? payment.getRegistration().getCourse().getTitle() : null))
                .registrationId(payment.getRegistration() != null ? payment.getRegistration().getId() : null)
                .tutorBankName(tutorBankName).tutorBankAccount(tutorBankAccount).tutorBankOwner(tutorBankOwner)
                .transferredToTutor(payment.isTransferredToTutor())
                .transferredAt(payment.getTransferredAt())
                .transferProofUrl(payment.getTransferProofUrl())
                .build();
    }
}
