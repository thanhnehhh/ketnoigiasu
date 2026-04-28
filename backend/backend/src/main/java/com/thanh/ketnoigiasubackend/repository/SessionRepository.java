package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.CourseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<CourseSession, Long> {
    List<CourseSession> findByCourseIdOrderByStartTimeDesc(Long courseId);
    Optional<CourseSession> findByCourseIdAndSessionOrder(Long courseId, Integer sessionOrder);
}