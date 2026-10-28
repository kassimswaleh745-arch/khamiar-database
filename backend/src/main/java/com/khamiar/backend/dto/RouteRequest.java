package com.khamiar.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RouteRequest(

        @NotBlank(message = "Route name is required")
        @Size(max = 150, message = "Route name is too long")
        String name,

        @NotNull(message = "Customer price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Customer price must be greater than zero")
        BigDecimal customerPrice,

        @NotNull(message = "System price is required")
        @DecimalMin(value = "0.0", message = "System price cannot be negative")
        BigDecimal systemPrice,

        Boolean active
) {}
