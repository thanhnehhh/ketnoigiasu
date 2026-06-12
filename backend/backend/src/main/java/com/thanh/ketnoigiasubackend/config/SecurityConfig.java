package com.thanh.ketnoigiasubackend.config;

import com.thanh.ketnoigiasubackend.security.JwtAuthenticationFilter;
import com.thanh.ketnoigiasubackend.security.JwtAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        // Cho phép tất cả OPTIONS preflight request
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // WebSocket endpoint — phải permitAll để SockJS handshake thành công
                        .requestMatchers("/ws/**").permitAll()

                        .requestMatchers("/api/auth/**", "/api/otp/**", "/api/public/**").permitAll()
                        .requestMatchers("/api/ai/**").permitAll()
                        .requestMatchers("/api/payments/vnpay/verify").permitAll()
                        .requestMatchers("/api/admin/payment-info/qr").hasRole("ADMIN")
                        .requestMatchers("/api/admin/platform-fee").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/admin/payment-info").hasRole("ADMIN")

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/tutor/**", "/api/courses/my-courses").hasAnyRole("TUTOR", "ADMIN")
                        .requestMatchers("/api/student/**").hasAnyRole("STUDENT", "ADMIN")                        .requestMatchers(HttpMethod.GET, "/api/tutor-profiles/**").hasAnyRole("STUDENT", "TUTOR", "ADMIN")
                        .requestMatchers("/api/complaints/**").hasRole("TUTOR")
                        .requestMatchers("/api/profile/**").authenticated()
                        .requestMatchers("/api/reviews/**").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.POST, "/api/materials/tutor/upload").hasRole("TUTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/materials/**").hasRole("TUTOR")
                        .requestMatchers(HttpMethod.GET, "/api/materials/course/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/materials/download/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/profile/tutor/avatar").hasRole("TUTOR")
                        .requestMatchers("/api/messages/**").authenticated() // Chat — cả tutor lẫn student
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}