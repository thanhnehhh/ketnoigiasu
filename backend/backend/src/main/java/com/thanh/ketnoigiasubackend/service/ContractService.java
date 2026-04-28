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

    // --- QUẢN LÝ CHO ADMIN ---

    // 1. Khởi tạo hợp đồng (Issue)
    @Transactional
    public ContractResponse issueContract(Long tutorId, String rawTemplate) {
        TutorProfile tutor = tutorProfileRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Gia sư không tồn tại"));

        // Trộn thông tin Gia sư vào văn bản
        String finalContent = rawTemplate
                .replace("{{TEN_GIA_SU}}", tutor.getUser().getFullName())
                .replace("{{EMAIL}}", tutor.getUser().getEmail())
                .replace("{{NGAY_TAO}}", LocalDateTime.now().toString());

        Contract contract = Contract.builder()
                .tutor(tutor)
                .contentSnapshot(finalContent)
                .status(ContractStatus.PENDING)
                .build();

        notificationService.createNotification(tutor.getUser(), "Bạn có một yêu cầu ký kết hợp đồng mới trên hệ thống.");

        Contract savedContract = contractRepository.save(contract);
        return mapToResponse(savedContract); // Trả về DTO
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

        // Nhúng ảnh vào văn bản HTML
        String signatureHtml = String.format(
                "<div style='text-align:center'><img src='%s' style='width:150px'/><br/><b>%s</b></div>",
                signatureBase64, contract.getTutor().getUser().getFullName()
        );

        contract.setContentSnapshot(contract.getContentSnapshot().replace("{{CHU_KY}}", signatureHtml));
        contract.setSignatureBase64(signatureBase64);
        contract.setStatus(ContractStatus.SIGNED);
        contract.setSignedAt(LocalDateTime.now());

        Contract savedContract = contractRepository.save(contract);
        return mapToResponse(savedContract); // Ký xong trả về hợp đồng mới nhất luôn
    }

    // 6. Lấy chi tiết 1 hợp đồng
    @Transactional(readOnly = true)
    public ContractResponse getContractById(Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng với ID này"));
        return mapToResponse(contract);
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