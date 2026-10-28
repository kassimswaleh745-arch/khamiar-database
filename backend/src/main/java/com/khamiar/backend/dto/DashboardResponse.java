package com.khamiar.backend.dto;

import java.math.BigDecimal;

public record DashboardResponse(
        long totalCustomers,
        BigDecimal totalIncome,
        BigDecimal totalSystem,
        BigDecimal totalProfit,
        long travellingToday,
        long monthCustomers,
        BigDecimal monthProfit,
        String month,
        boolean personal
) {}
