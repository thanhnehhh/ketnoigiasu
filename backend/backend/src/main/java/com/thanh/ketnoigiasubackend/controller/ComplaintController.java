package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.request.ComplaintRequest;
import com.thanh.ketnoigiasubackend.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<?> sendComplaint(@RequestBody ComplaintRequest request, Authentication auth) {
        return ResponseEntity.ok(complaintService.submitComplaint(auth.getName(), request));
    }
}