package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.Course;
import com.thanh.ketnoigiasubackend.entity.CourseRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRegistrationRepository extends JpaRepository<CourseRegistration, Long> {
    List<CourseRegistration> findByCourseTutorUserId(Long userId);

    List<CourseRegistration> findByStudentUserId(Long userId);

    List<CourseRegistration> findByCourseInAndStatusIn(List<Course> courses, List<String> statuses);

    List<CourseRegistration> findByCourseAndStatusIn(Course course, List<String> statuses);
}