package com.thanh.ketnoigiasubackend.config;

import com.thanh.ketnoigiasubackend.util.JwtUtil; // Import chuẩn file JwtUtil của bạn
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil; // Inject chuẩn JwtUtil vào đây
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        // Khi client gửi lệnh CONNECT lên, tiến hành check token
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7).trim();

                try {
                    // Lấy email từ token bằng JwtUtil của bạn
                    String email = jwtUtil.extractEmail(token);

                    if (email != null) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                        // Check token hợp lệ dựa trên hàm có sẵn của bạn
                        if (jwtUtil.isTokenValid(token, userDetails)) {
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                            // BẮT BUỘC: Đặt authentication vào session WebSocket này
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            accessor.setUser(authentication); // Đây chính là nơi tạo ra "Principal" cho Controller nhận
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Xác thực WebSocket thất bại: " + e.getMessage());
                }
            }
        }
        return message;
    }
}