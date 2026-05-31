package com.thanh.ketnoigiasubackend.controller;

import com.thanh.ketnoigiasubackend.dto.response.MessageResponse;
import com.thanh.ketnoigiasubackend.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/messages/course/{courseId}")
    public ResponseEntity<List<MessageResponse>> getHistory(@PathVariable Long courseId) {
        return ResponseEntity.ok(messageService.getMessages(courseId));
    }

    // REST fallback khi WebSocket mất kết nối
    @PostMapping("/api/messages/course/{courseId}/text")
    public ResponseEntity<MessageResponse> sendTextRest(
            @PathVariable Long courseId,
            @RequestBody Map<String, String> payload,
            Authentication auth) {
        String content = payload.get("content");
        String type = payload.getOrDefault("type", "TEXT");
        MessageResponse saved = messageService.sendText(courseId, auth.getName(), content, type);
        messagingTemplate.convertAndSend("/topic/chat/" + courseId, saved);
        return ResponseEntity.ok(saved);
    }

    @MessageMapping("/chat/{courseId}")
    public void sendMessage(
            @DestinationVariable Long courseId,
            @Payload Map<String, String> payload,
            Principal principal) {

        String content = payload.get("content");
        String type    = payload.getOrDefault("type", "TEXT"); // TEXT | EXERCISE

        MessageResponse saved = messageService.sendText(courseId, principal.getName(), content, type);

        messagingTemplate.convertAndSend("/topic/chat/" + courseId, saved);
    }

    @PostMapping("/api/messages/course/{courseId}/file")
    public ResponseEntity<MessageResponse> sendFile(
            @PathVariable Long courseId,
            @RequestParam String title,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        MessageResponse saved = messageService.sendFile(courseId, auth.getName(), title, file);

        messagingTemplate.convertAndSend("/topic/chat/" + courseId, saved);

        return ResponseEntity.ok(saved);
    }
}
