package com.thanh.ketnoigiasubackend.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;

@Service
public class FileStorageService {
    private final Path root = Paths.get("uploads/materials");

    public void init() {
        try {
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }
        } catch (IOException e) {
            throw new RuntimeException("Không thể khởi tạo thư mục lưu trữ!");
        }
    }

    public String save(MultipartFile file) {
        try {
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), this.root.resolve(fileName));
            return fileName;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi lưu file: " + e.getMessage());
        }
    }

    public Resource load(String fileName) {
        try {
            Path file = root.resolve(fileName);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Không thể đọc file hoặc file không tồn tại!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Lỗi: " + e.getMessage());
        }
    }

    public void delete(String fileName) {
        try {
            Files.deleteIfExists(this.root.resolve(fileName));
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi xóa file vật lý!");
        }
    }
}