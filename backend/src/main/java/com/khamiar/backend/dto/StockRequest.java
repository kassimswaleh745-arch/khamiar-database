package com.khamiar.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StockRequest(
        @NotNull(message = "Quantity is required") Integer quantity,
        @Size(max = 200, message = "Note is too long") String note
) {}
