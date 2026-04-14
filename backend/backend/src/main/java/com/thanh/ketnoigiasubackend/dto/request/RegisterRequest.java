package com.thanh.ketnoigiasubackend.dto.request;

import com.thanh.ketnoigiasubackend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    private String email;
    private String password;
    private String fullName;
    private String phone;
    private Role role;        // ADMIN, TUTOR, STUDENT
}