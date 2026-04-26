package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> sign(@PathVariable Long id, @RequestBody String base64) {
        contractService.signContract(id, base64);
        return ResponseEntity.ok("Ký thành công!");
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<String> getContractHtml(@PathVariable Long id) {
        return ResponseEntity.ok(contractService.getContractById(id).getContentSnapshot());
    }
}