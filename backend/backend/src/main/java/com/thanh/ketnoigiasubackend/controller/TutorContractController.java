package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.ContractResponse;
import com.thanh.ketnoigiasubackend.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tutor/contracts")
@RequiredArgsConstructor
public class TutorContractController {
    private final ContractService contractService;

    @GetMapping("/my")
    public ResponseEntity<?> getMy(@RequestParam Long tutorId) {
        return ResponseEntity.ok(contractService.getMyContracts(tutorId));
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