package com.khamiar.backend.dto;

import java.math.BigDecimal;

public record MonthlyReportRow(
        int month,
        long customers,
        BigDecimal income,
        BigDecimal systemAmount,
        BigDecimal profit
) {}
