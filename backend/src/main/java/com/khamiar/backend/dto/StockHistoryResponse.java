package com.khamiar.backend.dto;

import java.time.LocalDateTime;

public record StockHistoryResponse(
        Long id,
        Long routeId,
        int quantity,
        String note,
        String createdBy,
        LocalDateTime createdAt
) {}
