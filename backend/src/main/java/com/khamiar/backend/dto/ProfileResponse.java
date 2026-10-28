package com.khamiar.backend.dto;

import com.khamiar.backend.entity.Role;
import java.time.LocalDateTime;

public record ProfileResponse(
        Long id,
        String username,
        String fullName,
        String email,
        String phone,
        Role role,
        LocalDateTime createdAt) {}
