package com.khamiar.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReportResponse(
        LocalDate from,
        LocalDate to,
        String employee,          // null = wafanyakazi wote
        String generatedBy,
        LocalDateTime generatedAt,
        int count,
        BigDecimal totalSystem,
        BigDecimal totalCustomer,
        BigDecimal totalProfit,
        List<CustomerResponse> rows
) {}
