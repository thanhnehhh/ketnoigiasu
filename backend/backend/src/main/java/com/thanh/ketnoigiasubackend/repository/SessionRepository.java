package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.CourseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<CourseSession, Long> {
    List<CourseSession> findByCourseIdOrderByStartTimeDesc(Long courseId);
    List<CourseSession> findByCourseIdOrderBySessionOrderAsc(Long courseId);
    Optional<CourseSession> findByCourseIdAndSessionOrder(Long courseId, Integer sessionOrder);

    // Lấy các buổi gia sư đã xác nhận nhưng học viên chưa confirm, quá deadline
    @Query("SELECT s FROM CourseSession s WHERE s.isCompleted = true AND s.studentConfirmed = false AND s.studentDisputed = false AND s.updatedAt < :deadline")
    List<CourseSession> findExpiredUnconfirmedSessions(@Param("deadline") LocalDateTime deadline);
}