package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.ContractResponse;
import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.service.ContractService;
import com.thanh.ketnoigiasubackend.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tutor/contracts")
@RequiredArgsConstructor
public class TutorContractController {
    private final ContractService contractService;
    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final PdfExportService pdfExportService;

    @GetMapping("/my")
    public ResponseEntity<?> getMy(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        TutorProfile tutor = tutorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
        return ResponseEntity.ok(contractService.getMyContracts(tutor.getId()));
    }

    @PostMapping("/{id}/sign")
    public ResponseEntity<ContractResponse> sign(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String base64 = payload.get("signatureBase64");
        return ResponseEntity.ok(contractService.signContract(id, base64));
    }

    // Tải HTML (giữ lại để tương thích)
    @GetMapping("/{id}/download")
    public ResponseEntity<String> getContractHtml(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id).getContentSnapshot());
    }

    // Tải PDF hợp đồng
    @GetMapping("/{id}/download-pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id, Authentication auth) {
        ContractResponse contract = contractService.getContractById(id);

        // Kiểm tra quyền — chỉ gia sư sở hữu hợp đồng mới tải được
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        TutorProfile tutor = tutorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
        if (!contract.getTutorId().equals(tutor.getId())) {
            return ResponseEntity.status(403).build();
        }

        byte[] pdfBytes = pdfExportService.generateContractPdf(contract.getContentSnapshot());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"hop-dong-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
