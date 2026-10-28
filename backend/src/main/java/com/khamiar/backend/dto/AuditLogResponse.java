package com.khamiar.backend.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        LocalDateTime createdAt,
        String actor,
        String action,
        String details,
        String ip
) {}
