package com.thanh.ketnoigiasubackend.service;

import com.thanh.ketnoigiasubackend.dto.request.StudentProfileRequest;
import com.thanh.ketnoigiasubackend.dto.request.TutorProfileRequest;
import com.thanh.ketnoigiasubackend.entity.StudentProfile;
import com.thanh.ketnoigiasubackend.entity.TutorProfile;
import com.thanh.ketnoigiasubackend.entity.User;
import com.thanh.ketnoigiasubackend.enums.Role;
import com.thanh.ketnoigiasubackend.repository.StudentProfileRepository;
import com.thanh.ketnoigiasubackend.repository.TutorProfileRepository;
import com.thanh.ketnoigiasubackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TutorProfileRepository tutorProfileRepository;

    public Object getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.TUTOR) {
            return tutorProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
        } else if (user.getRole() == Role.STUDENT) {
            return studentProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Student profile not found"));
        }
        return user;
    }

    @Transactional
    public StudentProfile updateStudentProfile(String email, StudentProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        userRepository.save(user);

        StudentProfile profile = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getGradeLevel() != null) profile.setGradeLevel(request.getGradeLevel());
        if (request.getLearningGoals() != null) profile.setLearningGoals(request.getLearningGoals());

        return studentProfileRepository.save(profile);
    }

    @Transactional
    public TutorProfile updateTutorProfile(String email, TutorProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        userRepository.save(user);

        TutorProfile profile = tutorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getCccd() != null) profile.setCccd(request.getCccd());
        if (request.getCccdIssuedPlace() != null) profile.setCccdIssuedPlace(request.getCccdIssuedPlace());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getSchool() != null) profile.setSchool(request.getSchool());
        if (request.getMajor() != null) profile.setMajor(request.getMajor());
        if (request.getGraduationYear() != null) profile.setGraduationYear(request.getGraduationYear());
        if (request.getCurrentOccupation() != null) profile.setCurrentOccupation(request.getCurrentOccupation());
        if (request.getStrengths() != null) profile.setStrengths(request.getStrengths());
        if (request.getSubjects() != null) profile.setSubjects(request.getSubjects());
        if (request.getGrades() != null) profile.setGrades(request.getGrades());

        return tutorProfileRepository.save(profile);
    }
}