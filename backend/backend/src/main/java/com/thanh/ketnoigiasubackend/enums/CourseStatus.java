package com.thanh.ketnoigiasubackend.enums;

public enum CourseStatus {
    PENDING_APPROVE,    // Chờ admin duyệt
    APPROVED,           // Đã duyệt
    REJECTED,           // Bị từ chối
    ACTIVE,             // Đang mở đăng ký
    CLOSED              // Đã đóng
}