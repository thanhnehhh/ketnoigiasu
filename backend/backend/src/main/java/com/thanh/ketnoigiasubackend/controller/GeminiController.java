package com.thanh.ketnoigiasubackend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class GeminiController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @PostMapping("/gemini")
    public ResponseEntity<?> proxy(@RequestBody Map<String, Object> body) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + geminiApiKey;
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(url, request, Object.class);
            return ResponseEntity.ok(response.getBody());
        } catch (HttpStatusCodeException e) {
            // Bắt mọi lỗi HTTP từ Google (400, 401, 403, 500, 503...)
            System.err.println("[Gemini] API Error Status: " + e.getStatusCode());
            System.err.println("[Gemini] API Error Body: " + e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("error", e.getResponseBodyAsString()));
        } catch (Exception e) {
            // Bắt các lỗi hệ thống/mạng (Timeout, SSL, DNS...)
            System.err.println("[Gemini] Network/System Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể kết nối đến máy chủ AI: " + e.getMessage()));
        }
    }
}
