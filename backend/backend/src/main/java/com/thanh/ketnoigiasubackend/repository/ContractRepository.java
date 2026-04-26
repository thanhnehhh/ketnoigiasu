package com.thanh.ketnoigiasubackend.repository;

import com.thanh.ketnoigiasubackend.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    List<Contract> findByTutorId(Long tutorId);

}