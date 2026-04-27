package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.MaterialResponse;
import com.thanh.ketnoigiasubackend.entity.LearningMaterial;
import com.thanh.ketnoigiasubackend.service.FileStorageService;
import com.thanh.ketnoigiasubackend.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialController {
    private final MaterialService materialService;
    private final FileStorageService fileStorageService;

    @PostMapping("/tutor/upload")
    public ResponseEntity<MaterialResponse> upload(
                                                    @RequestParam Long tutorId,
                                                    @RequestParam Long courseId,
                                                    @RequestParam String title,
                                                    @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(materialService.saveMaterial(tutorId, courseId, title, file));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<MaterialResponse>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(materialService.getMaterialsByCourse(courseId));
    }

    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> download(@PathVariable String fileName) {
        Resource file = fileStorageService.load(fileName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.ok("Xóa tài liệu thành công");
    }
}