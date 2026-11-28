package com.khamiar.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import com.khamiar.backend.service.SystemService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/technical")
public class TechnicalHealthController {

    private final JdbcTemplate jdbc;
    private final SystemService systemService;

    public TechnicalHealthController(
            JdbcTemplate jdbc,
            SystemService systemService) {
        this.jdbc = jdbc;
        this.systemService = systemService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {

        boolean databaseConnected;

        try {
            Integer result = jdbc.queryForObject(
                "SELECT 1", Integer.class
            );

            databaseConnected = Integer.valueOf(1).equals(result);

        } catch (Exception e) {
            databaseConnected = false;
        }

        String maintenanceStatus = "UNKNOWN";

        if (databaseConnected) {
            try {
                maintenanceStatus = systemService.isLocked()
                        ? "ACTIVE"
                        : "INACTIVE";
            } catch (Exception e) {
                maintenanceStatus = "UNKNOWN";
            }
        }

        return Map.of(
            "application", "KHAMIAR Database Management System",
            "backend", "ONLINE",
            "database", databaseConnected ? "CONNECTED" : "UNAVAILABLE",
            "status", databaseConnected ? "HEALTHY" : "DEGRADED",
            "maintenance", maintenanceStatus,
            "checkedAt", Instant.now().toString()
        );
    }
}
