package com.khamiar.backend.dto;

import java.math.BigDecimal;

public record CustomerReportRow(
        Long id,
        String customerName,
        String travelDate,
        String route,
        String phone,
        BigDecimal systemAmount,
        BigDecimal customerAmount,
        BigDecimal profit,
        String createdAt
) {}
