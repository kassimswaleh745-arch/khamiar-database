package com.khamiar.backend.dto;

import java.time.LocalDate;
import java.util.List;

public record ManifestResponse(
        RouteResponse route,
        LocalDate date,
        List<CustomerResponse> customers
) {}
