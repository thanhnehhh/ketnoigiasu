package com.thanh.ketnoigiasubackend.config;

import lombok.RequiredArgsConstructor; // Thêm import này
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration; // Thêm import này
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor // Thêm cái này để Spring tự động inject Interceptor bên dưới
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Inject file interceptor đã sửa ở bước 1 vào đây
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Bean
    public TaskScheduler webSocketTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[]{10000, 10000})
                .setTaskScheduler(webSocketTaskScheduler());
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // SỬA TỪ .setAllowedOriginPatterns("*") THÀNH ORIGIN CỤ THỂ NÀY:
                .setAllowedOrigins("http://localhost:5173")
                .withSockJS();
    }

    // THÊM ĐOẠN NÀY: Để đăng ký Interceptor bắt Token vào luồng xử lý WebSocket
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}