package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.MessageResponse;
import com.thanh.ketnoigiasubackend.entity.*;
import com.thanh.ketnoigiasubackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    /** Lấy toàn bộ tin nhắn của lớp học */
    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long courseId) {
        return messageRepository.findByCourseIdOrderByCreatedAtAsc(courseId)
                .stream().map(this::toResponse).toList();
    }

    /** Gửi tin nhắn text hoặc bài tập */
    @Transactional
    public MessageResponse sendText(Long courseId, String senderEmail, String content, String type) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học"));
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Message msg = Message.builder()
                .course(course)
                .sender(sender)
                .type(type != null ? type : "TEXT")
                .content(content)
                .build();

        return toResponse(messageRepository.save(msg));
    }

    /** Gửi file/tài liệu */
    @Transactional
    public MessageResponse sendFile(Long courseId, String senderEmail, String title, MultipartFile file) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học"));
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String savedName = fileStorageService.save(file);

        Message msg = Message.builder()
                .course(course)
                .sender(sender)
                .type("FILE")
                .content(title != null ? title : file.getOriginalFilename())
                .fileUrl("/api/materials/download/" + savedName)
                .fileName(savedName)
                .build();

        return toResponse(messageRepository.save(msg));
    }

    private MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .courseId(m.getCourse().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .senderRole(m.getSender().getRole().name())
                .type(m.getType())
                .content(m.getContent())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
