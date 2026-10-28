package com.khamiar.backend.dto;

public record LoginResponse(
        String token,
        String username,
        String role,
        long expiresInMinutes
) {}
