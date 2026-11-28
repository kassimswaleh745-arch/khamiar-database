package com.khamiar.backend.controller;

import com.khamiar.backend.service.DashboardService;
import com.khamiar.backend.dto.DashboardResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/technical")
public class DeveloperBusinessController {

    private final DashboardService dashboard;

    public DeveloperBusinessController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping("/business-overview")
    @PreAuthorize("hasRole('DEVELOPER')")
    public Map<String, Object> overview() {

        DashboardResponse data = dashboard.build("", true);

        return Map.of(
            "totalCustomers", data.totalCustomers(),
            "travellingToday", data.travellingToday(),
            "monthCustomers", data.monthCustomers(),
            "month", data.month()
        );
    }
}
