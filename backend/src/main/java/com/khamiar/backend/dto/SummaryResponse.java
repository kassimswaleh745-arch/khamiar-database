package com.khamiar.backend.dto;

import java.math.BigDecimal;

public record SummaryResponse(
        long totalCustomers,
        BigDecimal totalIncome,
        BigDecimal totalSystem,
        BigDecimal totalProfit,
        long travellingToday,
        long monthCustomers,
        BigDecimal monthProfit
) {}
