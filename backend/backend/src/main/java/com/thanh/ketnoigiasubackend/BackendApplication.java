package com.thanh.ketnoigiasubackend;

import com.thanh.ketnoigiasubackend.entity.Subject;
import com.thanh.ketnoigiasubackend.repository.SubjectRepository;
import com.thanh.ketnoigiasubackend.service.FileStorageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.List;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class BackendApplication {

    @Bean
    CommandLineRunner init(FileStorageService fileStorageService, SubjectRepository subjectRepository) {
        return (args) -> {
            fileStorageService.init();

            // Seed môn học nếu chưa có
            List<String> defaultSubjects = List.of(
                "Toán", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn",
                "Tiếng Anh", "Lịch sử", "Địa lý", "Tin học",
                "Tiếng Trung", "Tiếng Nhật", "Tiếng Hàn",
                "IELTS", "TOEIC", "Toán nâng cao", "Lập trình"
            );
            for (String name : defaultSubjects) {
                if (subjectRepository.findByName(name).isEmpty()) {
                    subjectRepository.save(Subject.builder().name(name).build());
                }
            }
        };
    }

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}