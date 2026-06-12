package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.ContractResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.ContractStatus;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractService {
    private final ContractRepository contractRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final NotificationService notificationService;
    private final SystemConfigRepository systemConfigRepository;

    // --- QUẢN LÝ CHO ADMIN ---

    // 1. Khởi tạo hợp đồng (Issue)
    @Transactional
    public ContractResponse issueContract(Long tutorId, String rawTemplate) {
        TutorProfile tutor = tutorProfileRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Gia sư không tồn tại"));

        // Tự sinh số hợp đồng theo năm + id gia sư
        long contractCount = contractRepository.count() + 1;
        String soHopDong = String.format("%04d", contractCount) + "-" + java.time.LocalDate.now().getYear() + ".KNGS/HD";

        // Ngày tháng năm dạng dd/MM/yyyy
        String ngayTao = java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        // Lấy % phí từ SystemConfig (mặc định 15% online, 8% offline)
        String onlineFee  = systemConfigRepository.findById("fee.online").map(c -> c.getValue()).orElse("15.0");
        String offlineFee = systemConfigRepository.findById("fee.offline").map(c -> c.getValue()).orElse("8.0");
        // Bỏ .0 nếu là số nguyên cho đẹp
        String onlineFeeDisplay  = onlineFee.endsWith(".0")  ? onlineFee.replace(".0", "")  : onlineFee;
        String offlineFeeDisplay = offlineFee.endsWith(".0") ? offlineFee.replace(".0", "") : offlineFee;

        // Phí sàn đăng ký (phí nộp 1 lần khi bắt đầu)
        String phiSan = systemConfigRepository.findById("fee.platform").map(c -> c.getValue()).orElse("200.000");

        // Dùng template mặc định nếu Admin không truyền vào (hoặc truyền rỗng)
        String template = (rawTemplate == null || rawTemplate.isBlank())
                ? buildDefaultTemplate()
                : rawTemplate;

        // Trộn thông tin vào template
        String finalContent = template
                .replace("{{TEN_GIA_SU}}", tutor.getUser().getFullName())
                .replace("{{EMAIL}}", tutor.getUser().getEmail())
                .replace("{{NGAY_TAO}}", ngayTao)
                .replace("{{SO_HD}}", soHopDong)
                .replace("{{PHI_ONLINE}}", onlineFeeDisplay)
                .replace("{{PHI_OFFLINE}}", offlineFeeDisplay)
                .replace("{{PHI_SAN}}", phiSan);

        Contract contract = Contract.builder()
                .tutor(tutor)
                .contentSnapshot(finalContent)
                .status(ContractStatus.PENDING)
                .build();

        notificationService.createNotification(tutor.getUser(),
                "📄 Bạn có hợp đồng mới cần ký. Vui lòng xem và ký kết.",
                "/tutor/contracts");

        Contract savedContract = contractRepository.save(contract);
        return mapToResponse(savedContract);
    }

    // Template hợp đồng mặc định cho nền tảng kết nối gia sư
    private String buildDefaultTemplate() {
        return """
            <div style="font-family:'Times New Roman',serif;font-size:13pt;line-height:1.8;color:#000;max-width:750px;margin:0 auto;padding:40px;">

              <div style="text-align:center;margin-bottom:24px;">
                <h2 style="font-size:16pt;font-weight:bold;margin:0;">HỢP ĐỒNG CUNG CẤP DỊCH VỤ GIA SƯ</h2>
                <p style="margin:4px 0;font-size:12pt;">Số: {{SO_HD}}</p>
              </div>

              <p>Hợp đồng này được lập và ký kết vào ngày <strong>{{NGAY_TAO}}</strong> giữa và bởi:</p>

              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="width:130px;padding:4px 0;font-weight:bold;">BÊN A</td><td style="padding:4px 0;">: <strong>NỀN TẢNG KẾT NỐI GIA SƯ (KNGS)</strong></td></tr>
                <tr><td style="padding:4px 0;">Đại diện</td><td style="padding:4px 0;">: <strong>Ban Quản Trị Hệ Thống</strong></td></tr>
                <tr><td style="padding:4px 0;">Vai trò</td><td style="padding:4px 0;">: Quản trị viên nền tảng</td></tr>
              </table>
              <p><em>(Sau đây gọi là <strong>"Bên A"</strong> hoặc <strong>"Nền Tảng"</strong>); và</em></p>

              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="width:130px;padding:4px 0;font-weight:bold;">BÊN B</td><td style="padding:4px 0;">: <strong>{{TEN_GIA_SU}}</strong></td></tr>
                <tr><td style="padding:4px 0;">Email</td><td style="padding:4px 0;">: {{EMAIL}}</td></tr>
                <tr><td style="padding:4px 0;">CCCD</td><td style="padding:4px 0;">: ____________________________</td></tr>
              </table>
              <p><em>(Sau đây gọi là <strong>"Bên B"</strong> hoặc <strong>"Gia Sư"</strong>)</em></p>

              <p>Sau khi thảo luận và thống nhất, Các Bên đồng ý ký kết Hợp Đồng này với các điều khoản như sau:</p>

              <p><strong>Điều 1. Phạm vi dịch vụ</strong><br/>
              Bên A đồng ý cung cấp cho Bên B quyền sử dụng nền tảng KetNoiGiaSu để đăng tải hồ sơ gia sư, tạo và quản lý các khóa học kèm 1-1, tiếp nhận học viên và thực hiện dịch vụ giảng dạy. Bên B được toàn quyền thiết lập mức học phí, lịch dạy và hình thức dạy học (Online hoặc Offline tại nhà) theo đúng thông tin đã đăng ký trên hệ thống.</p>

              <p><strong>Điều 2. Nghĩa vụ của Gia Sư</strong><br/>
              Bên B cam kết thực hiện đầy đủ và đúng chất lượng các buổi dạy đã xác nhận với học viên. Sau mỗi buổi dạy, Bên B phải ghi nhật ký buổi học và xác nhận hoàn thành thông qua hệ thống điện tử trên nền tảng. Bên B không được tự ý hủy buổi dạy mà không có lý do chính đáng hoặc không thông báo trước cho học viên.</p>

              <p><strong>Điều 3. Phí dịch vụ sàn</strong><br/>
              Bên B đồng ý thanh toán phí sử dụng nền tảng theo các mức sau:</p>
              <ul style="margin:8px 0 8px 24px;">
                <li><strong>Phí đăng ký ban đầu:</strong> <strong>{{PHI_SAN}}đ</strong> — nộp một lần trước khi tạo khóa học đầu tiên, dùng để xác minh gia sư và duy trì tài khoản hoạt động trên nền tảng.</li>
                <li><strong>Phí buổi dạy Online:</strong> <strong>{{PHI_ONLINE}}%</strong> trên giá trị mỗi buổi dạy — áp dụng khi buổi dạy có link phòng học trực tuyến (Google Meet, Zoom...).</li>
                <li><strong>Phí buổi dạy Offline (tại nhà):</strong> <strong>{{PHI_OFFLINE}}%</strong> trên giá trị mỗi buổi dạy — mức phí thấp hơn nhằm hỗ trợ chi phí di chuyển cho Bên B.</li>
              </ul>
              <p>Phí sàn được khấu trừ tự động sau khi học viên xác nhận hoàn thành buổi học. Phần còn lại sẽ được Bên A chuyển khoản cho Bên B sau khi toàn bộ khóa học kết thúc và được xác nhận bởi cả hai phía.</p>

              <p><strong>Điều 4. Quy trình thanh toán</strong><br/>
              Học viên thanh toán học phí trực tiếp cho Bên A thông qua các phương thức được hỗ trợ trên nền tảng (chuyển khoản ngân hàng, VietQR, ZaloPay, VNPay). Bên A đóng vai trò trung gian giữ học phí và chuyển lại cho Bên B sau khi khóa học hoàn thành, đã trừ phí dịch vụ sàn theo Điều 3.</p>

              <p><strong>Điều 5. Điểm uy tín</strong><br/>
              Hệ thống tự động cộng hoặc trừ điểm uy tín của Bên B dựa trên đánh giá từ học viên sau mỗi khóa học. Điểm uy tín ảnh hưởng trực tiếp đến thứ tự hiển thị của Bên B trong kết quả tìm kiếm trên nền tảng. Cụ thể: đánh giá 5 sao cộng 10 điểm, 4 sao cộng 7 điểm, 3 sao cộng 3 điểm, 2 sao trừ 5 điểm, 1 sao trừ 10 điểm. Vi phạm được Admin xác nhận trừ 15 điểm.</p>

              <p><strong>Điều 6. Xử lý vi phạm</strong><br/>
              Trong trường hợp Bên B vi phạm — bao gồm nhưng không giới hạn: không dạy đúng cam kết, gian lận xác nhận buổi học, có hành vi không phù hợp với học viên — Bên A có quyền:</p>
              <ul style="margin:8px 0 8px 24px;">
                <li>Khóa tài khoản và ẩn toàn bộ khóa học của Bên B trên nền tảng.</li>
                <li>Trừ điểm uy tín và thông báo đến học viên liên quan.</li>
                <li>Giữ lại phần học phí chưa thanh toán để xử lý theo yêu cầu hoàn tiền của học viên.</li>
              </ul>

              <p><strong>Điều 7. Thời hạn và chấm dứt hợp đồng</strong><br/>
              Hợp Đồng này có hiệu lực kể từ ngày ký và duy trì trong suốt thời gian Bên B hoạt động trên nền tảng. Bên A có quyền chấm dứt Hợp Đồng đơn phương và không hoàn lại phí đăng ký nếu Bên B vi phạm nghiêm trọng các điều khoản đã cam kết.</p>

              <p><strong>Điều 8.</strong> Hợp Đồng này được lập thành 02 (hai) bản điện tử có giá trị pháp lý như nhau. Mỗi Bên giữ 01 (một) bản để thực hiện.</p>

              <p><strong>ĐỂ LÀM BẰNG CHỨNG</strong>, Các Bên đã ký Hợp Đồng này vào ngày ghi tại trang đầu tiên.</p>

              <div style="display:flex;justify-content:space-between;margin-top:48px;text-align:center;">
                <div style="width:45%;">
                  <p style="font-weight:bold;margin-bottom:60px;">ĐẠI DIỆN NỀN TẢNG</p>
                  <p style="font-weight:bold;margin:0;">BAN QUẢN TRỊ KNGS</p>
                  <p style="margin:0;font-size:11pt;">Quản trị viên</p>
                </div>
                <div style="width:45%;">
                  <p style="font-weight:bold;margin-bottom:4px;">GIA SƯ</p>
                  <div style="min-height:60px;display:flex;align-items:center;justify-content:center;">
                    {{CHU_KY}}
                  </div>
                  <p style="font-weight:bold;margin:0;">{{TEN_GIA_SU}}</p>
                  <p style="margin:0;font-size:11pt;">Gia Sư</p>
                </div>
              </div>

            </div>
            """;
    }

    // 2. Theo dõi trạng thái ký kết
    @Transactional(readOnly = true)
    public List<ContractResponse> getAllContracts() {
        return contractRepository.findAll()
                .stream()
                .map(this::mapToResponse) // Dùng Stream map từng Entity sang DTO
                .collect(Collectors.toList());
    }

    // 3. Xóa hợp đồng lỗi
    @Transactional
    public void deleteContract(Long id) {
        contractRepository.deleteById(id);
    }

    // --- QUẢN LÝ CHO TUTOR ---

    // 4. Tra cứu lịch sử hợp đồng của tôi
    @Transactional(readOnly = true)
    public List<ContractResponse> getMyContracts(Long tutorId) {
        return contractRepository.findByTutorId(tutorId)
                .stream()
                .map(this::mapToResponse) // Dùng Stream map từng Entity sang DTO
                .collect(Collectors.toList());
    }

    // 5. Thực hiện ký kết (Nhúng chữ ký Base64)
    @Transactional
    public ContractResponse signContract(Long contractId, String signatureBase64) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không thấy hợp đồng"));

        if (contract.getStatus() != ContractStatus.PENDING)
            throw new RuntimeException("Hợp đồng này không thể ký");

        // Nhúng ảnh vào văn bản HTML — dùng base64 trực tiếp cho chữ ký
        // Đảm bảo cắt bớt nếu quá dài (chỉ lấy phần data URL, tối đa 2MB)
        String sigSafe = signatureBase64;
        if (sigSafe != null && sigSafe.length() > 2_000_000) {
            throw new RuntimeException("Ảnh chữ ký quá lớn. Vui lòng dùng ảnh PNG nhỏ hơn 1.5MB sau khi tách nền.");
        }

        String signatureHtml = String.format(
                "<div style='text-align:center'><img src='%s' style='max-width:180px;max-height:80px;object-fit:contain'/></div>",
                sigSafe
        );

        contract.setContentSnapshot(contract.getContentSnapshot().replace("{{CHU_KY}}", signatureHtml));
        contract.setSignatureBase64(sigSafe);
        contract.setStatus(ContractStatus.SIGNED);
        contract.setSignedAt(LocalDateTime.now());

        Contract savedContract = contractRepository.save(contract);
        return mapToResponse(savedContract);
    }

    // 6. Lấy chi tiết 1 hợp đồng
    @Transactional(readOnly = true)
    public ContractResponse getContractById(Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng với ID này"));
        return mapToResponse(contract);
    }

    // 7. Gia sư yêu cầu Admin cấp hợp đồng
    public void requestContractFromAdmin(TutorProfile tutor) {
        // Kiểm tra đã có hợp đồng chưa
        boolean hasContract = !contractRepository.findByTutorId(tutor.getId()).isEmpty();
        if (hasContract) {
            throw new RuntimeException("Bạn đã có hợp đồng rồi!");
        }
        // Thông báo cho Admin
        notificationService.notifyAdmins(
                "📩 Gia sư " + tutor.getUser().getFullName() + " (" + tutor.getUser().getEmail() + ") yêu cầu cấp hợp đồng. Tutor ID: " + tutor.getId(),
                "/admin?tab=contracts"
        );
        // Thông báo lại cho gia sư
        notificationService.createNotification(tutor.getUser(),
                "✅ Đã gửi yêu cầu cấp hợp đồng đến Admin. Vui lòng chờ xét duyệt.",
                "/tutor/contracts");
    }

    // --- HELPER METHOD ---
    private ContractResponse mapToResponse(Contract contract) {
        return ContractResponse.builder()
                .id(contract.getId())
                .tutorId(contract.getTutor().getId())
                .tutorName(contract.getTutor().getUser().getFullName())
                .tutorEmail(contract.getTutor().getUser().getEmail())
                .contentSnapshot(contract.getContentSnapshot())
                .signatureBase64(contract.getSignatureBase64())
                .status(contract.getStatus().name())
                .signedAt(contract.getSignedAt())
                .createdAt(contract.getCreatedAt())
                .build();
    }
}