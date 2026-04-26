package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByTutorUserId(Long userId);
}