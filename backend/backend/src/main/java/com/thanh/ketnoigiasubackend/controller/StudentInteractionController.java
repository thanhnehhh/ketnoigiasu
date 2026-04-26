package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.ReportRequest;
import com.thanh.ketnoigiasubackend.service.InteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student/reports")
@RequiredArgsConstructor
public class StudentInteractionController {
    private final InteractionService interactionService;

    @PostMapping
    public ResponseEntity<?> reportViolation(@RequestBody ReportRequest request, Authentication auth) {
        interactionService.sendReport(auth.getName(), request);
        return ResponseEntity.ok("Đã gửi báo cáo vi phạm.");
    }
}