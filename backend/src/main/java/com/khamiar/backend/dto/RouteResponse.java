package com.khamiar.backend.dto;

import java.math.BigDecimal;

/** systemPrice ni null kwa staff (admin pekee anaiona) */
public record RouteResponse(
        Long id,
        String name,
        BigDecimal customerPrice,
        BigDecimal systemPrice,
        boolean active,
        int stock,
        int issued,
        int used,
        int remaining
) {}
