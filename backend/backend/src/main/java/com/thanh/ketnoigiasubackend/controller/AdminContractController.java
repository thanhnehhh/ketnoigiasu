package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.ContractResponse;
import com.thanh.ketnoigiasubackend.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/contracts")
@RequiredArgsConstructor
public class AdminContractController {
    private final ContractService contractService;

    @PostMapping("/issue")
    public ResponseEntity<ContractResponse> issue(@RequestParam Long tutorId, @RequestBody String templateHtml) {
        return ResponseEntity.ok(contractService.issueContract(tutorId, templateHtml));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(contractService.getAllContracts());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        contractService.deleteContract(id);
        return ResponseEntity.ok("Đã xóa hợp đồng.");
    }
}