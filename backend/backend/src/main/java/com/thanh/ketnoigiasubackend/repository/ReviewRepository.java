package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTutorUserId(Long tutorUserId);
    List<Review> findByRegistrationCourseId(Long courseId);
    @Query("SELECT r FROM Review r WHERE r.registration.course.id = :courseId")
    List<Review> findByCourseId(@Param("courseId") Long courseId);
    @Query("SELECT r FROM Review r WHERE r.registration.course.id = :courseId AND r.rating > 0")
    List<Review> findValidReviewsByCourseId(@Param("courseId") Long courseId);
}