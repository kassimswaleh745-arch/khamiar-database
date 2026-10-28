package com.khamiar.backend.dto;

import com.khamiar.backend.entity.TicketStatus;
import java.time.LocalDate;

/** Bila pesa: staff wote wanaruhusiwa kuona orodha hii */
public record DepartureResponse(
        Long id,
        String customerName,
        LocalDate travelDate,
        String route,
        String phone,
        Integer ticketCount,
        TicketStatus ticketStatus,
        String createdBy
) {}
