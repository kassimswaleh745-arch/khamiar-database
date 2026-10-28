package com.khamiar.backend.dto;

import com.khamiar.backend.entity.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record TicketStatusRequest(
        @NotNull(message = "Status is required") TicketStatus status
) {}
