package com.khamiar.backend.dto;

import com.khamiar.backend.entity.TicketStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String customerName,
        LocalDate travelDate,
        String route,
        String phone,
        BigDecimal systemAmount,
        BigDecimal customerAmount,
        BigDecimal profit,
        LocalDateTime createdAt,
        String createdBy,
        String email,
        Long routeId,
        Integer ticketCount,
        TicketStatus ticketStatus
) {}
