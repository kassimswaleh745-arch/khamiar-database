package com.khamiar.backend.dto;

import java.util.List;

public record AuditPageResponse(
    List<AuditLogResponse> rows,
    int page,
    int size,
    long totalElements,
    int totalPages,
    long totalActivities,
    long todayActivities,
    long securityEvents
) {}
