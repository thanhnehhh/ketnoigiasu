package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.ContractResponse;
import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import com.thanh.ketnoigiasubackend.service.ContractService;
import lombok.RequiredArgsConstructor;
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

    // FIX: lấy tutorId từ JWT thay vì @RequestParam — tránh lộ hợp đồng người khác
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

    @GetMapping("/{id}/download")
    public ResponseEntity<String> getContractHtml(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id).getContentSnapshot());
    }
}
