package com.thanh.ketnoigiasubackend;

import com.thanh.ketnoigiasubackend.service.FileStorageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BackendApplication {
    @Bean
    CommandLineRunner init(FileStorageService fileStorageService) {
        return (args) -> {
            fileStorageService.init();
        };
    }

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}