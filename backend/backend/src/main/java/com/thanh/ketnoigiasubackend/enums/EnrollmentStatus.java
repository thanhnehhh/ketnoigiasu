package com.thanh.ketnoigiasubackend.enums;

public enum EnrollmentStatus {
    PENDING_PAYMENT,     // Chờ học viên thanh toán
    PAYMENT_VERIFIED,    // Admin đã duyệt thanh toán
    ACTIVE,              // Đang học
    COMPLETED,           // Hoàn thành khóa học
    CANCELLED            // Đã hủy
}