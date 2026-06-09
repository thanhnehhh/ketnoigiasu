package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.response.CourseResponse;
import com.thanh.ketnoigiasubackend.dto.response.TutorProfileResponse;
import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.repository.CourseRepository;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TutorProfileService {

    private final TutorProfileRepository tutorProfileRepository;
    private final CourseRepository courseRepository;

    public List<TutorProfileResponse> getAllTutors(String keyword, String subject) {
        return tutorProfileRepository.findAll().stream()
            .filter(t -> t.getUser() != null && t.getUser().isEnabled())
            .filter(t -> {
                if (keyword == null || keyword.isEmpty()) return true;
                String kw = keyword.toLowerCase();
                return t.getUser().getFullName().toLowerCase().contains(kw)
                    || (t.getStrengths() != null && t.getStrengths().toLowerCase().contains(kw))
                    || (t.getSubjects() != null && t.getSubjects().toLowerCase().contains(kw));
            })
            .filter(t -> {
                if (subject == null || subject.isEmpty()) return true;
                return t.getSubjects() != null && t.getSubjects().contains(subject);
            })
            .sorted((a, b) -> Integer.compare(b.getReputationScore(), a.getReputationScore())) // Sắp xếp theo điểm uy tín giảm dần
            .map(t -> TutorProfileResponse.builder()
                .id(t.getId())
                .fullName(t.getUser().getFullName())
                .email(t.getUser().getEmail())
                .phone(t.getUser().getPhone())
                .school(t.getSchool())
                .major(t.getMajor())
                .strengths(t.getStrengths())
                .address(t.getAddress())
                .avatarUrl(t.getAvatarUrl())
                .reputationScore(t.getReputationScore())
                .reputationLabel(ReputationService.getLabel(t.getReputationScore()))
                .courses(java.util.List.of())
                .build())
            .toList();
    }

    public TutorProfileResponse getPublicProfile(Long tutorId) {        // 1. Tìm thông tin gia sư
        TutorProfile tutor = tutorProfileRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin gia sư!"));

        // 2. Lấy danh sách khóa học của gia sư đó (Dùng cái CourseResponse mình đã làm nãy)
        // Lưu ý: Chỉ lấy những khóa học đã duyệt hoặc tùy ông muốn hiện hết không
        List<CourseResponse> courses = courseRepository.findByTutorUserId(tutor.getUser().getId())
                .stream()
                .map(course -> CourseResponse.builder()
                        .id(course.getId())
                        .title(course.getTitle())
                        .subjectName(course.getSubject().getName())
                        .pricePerSession(course.getPricePerSession())
                        .status(course.getStatus().name())
                        .isPromoted(course.isPromoted())
                        .build())
                .toList();

        // 3. Map sang DTO Response để trả về
        return TutorProfileResponse.builder()
                .id(tutor.getId())
                .fullName(tutor.getUser().getFullName())
                .email(tutor.getUser().getEmail())
                .phone(tutor.getUser().getPhone())
                .school(tutor.getSchool())
                .major(tutor.getMajor())
                .graduationYear(tutor.getGraduationYear())
                .currentOccupation(tutor.getCurrentOccupation())
                .strengths(tutor.getStrengths())
                .address(tutor.getAddress())
                .subjects(tutor.getSubjects() != null ?
                        java.util.Arrays.asList(tutor.getSubjects().split("\\s*,\\s*")) : java.util.List.of())
                .grades(tutor.getGrades() != null ?
                        java.util.Arrays.asList(tutor.getGrades().split("\\s*,\\s*")) : java.util.List.of())
                .bio(tutor.getBio())
                .avatarUrl(tutor.getAvatarUrl())
                .teachingMode(tutor.getTeachingMode())
                .reputationScore(tutor.getReputationScore())
                .reputationLabel(ReputationService.getLabel(tutor.getReputationScore()))
                .courses(courses)
                .build();
    }
}