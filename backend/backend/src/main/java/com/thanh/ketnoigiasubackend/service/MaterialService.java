package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.MaterialResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialService {
    private final LearningMaterialRepository materialRepository;
    private final FileStorageService fileStorageService;
    private final TutorProfileRepository tutorProfileRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public MaterialResponse saveMaterial(Long tutorId, Long courseId, String title, MultipartFile file) {
        // 1. Kiểm tra lớp học
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Lớp học không tồn tại"));

        // 2. Kiểm tra quyền sở hữu (Security logic)
        if (!course.getTutor().getId().equals(tutorId)) {
            throw new RuntimeException("Ông không dạy lớp này nên không được up tài liệu nhé!");
        }

        // 3. Lưu file vật lý vào ổ cứng
        String savedName = fileStorageService.save(file);

        // 4. Lưu Metadata vào Database
        LearningMaterial material = LearningMaterial.builder()
                .title(title)
                .fileName(savedName)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .tutor(course.getTutor())
                .course(course)
                .build();

        LearningMaterial saved = materialRepository.save(material);

        // 5. Trả về DTO (Chỉ những thông tin cần thiết)
        return MaterialResponse.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .fileName(saved.getFileName())
                .fileType(saved.getFileType())
                .fileSize(saved.getFileSize())
                .tutorName(saved.getTutor().getUser().getFullName())
                .courseId(saved.getCourse().getId())
                .createdAt(saved.getCreatedAt().toString())
                .build();
    }
    @Transactional
    public List<MaterialResponse> getMaterialsByCourse(Long courseId) {
        return materialRepository.findByCourseId(courseId).stream()
                .map(m -> MaterialResponse.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .fileName(m.getFileName())
                        .fileType(m.getFileType())
                        .fileSize(m.getFileSize())
                        .tutorName(m.getTutor().getUser().getFullName()) // Lấy tên từ User
                        .courseId(m.getCourse().getId())
                        .createdAt(m.getCreatedAt().toString())
                        .build())
                .toList(); // Hoặc .collect(Collectors.toList()) tùy bản Java
    }

    @Transactional
    public void deleteMaterial(Long id) {
        LearningMaterial material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tài liệu không tồn tại"));

        fileStorageService.delete(material.getFileName());
        materialRepository.delete(material);
    }
}