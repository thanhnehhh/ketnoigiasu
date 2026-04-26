package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.enums.ContractStatus;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractService {
    private final ContractRepository contractRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final NotificationService notificationService;

    // --- QUẢN LÝ CHO ADMIN ---

    // 1. Khởi tạo hợp đồng (Issue)
    @Transactional
    public Contract issueContract(Long tutorId, String rawTemplate) {
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
        return contractRepository.save(contract);
    }

    // 2. Theo dõi trạng thái ký kết
    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    // 3. Xóa hợp đồng lỗi
    public void deleteContract(Long id) {
        contractRepository.deleteById(id);
    }

    // --- QUẢN LÝ CHO TUTOR ---

    // 4. Tra cứu lịch sử hợp đồng của tôi
    public List<Contract> getMyContracts(Long tutorId) {
        return contractRepository.findByTutorId(tutorId);
    }

    // 5. Thực hiện ký kết (Nhúng chữ ký Base64)
    @Transactional
    public void signContract(Long contractId, String signatureBase64) {
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

        contractRepository.save(contract);
    }

    public Contract getContractById(Long id) {
        return contractRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng với ID này"));
    }

}