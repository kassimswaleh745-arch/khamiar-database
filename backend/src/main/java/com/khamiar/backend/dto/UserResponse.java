package com.khamiar.backend.dto;

import com.khamiar.backend.entity.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String email,
        Role role,
        boolean active,
        LocalDateTime createdAt
) {}
