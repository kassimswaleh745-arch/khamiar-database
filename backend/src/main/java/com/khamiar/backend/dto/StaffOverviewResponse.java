package com.khamiar.backend.dto;

import java.util.List;

public record StaffOverviewResponse(
        int totalStaff,
        int working,
        int suspended,
        int admins,
        List<StaffRow> staff
) {}
