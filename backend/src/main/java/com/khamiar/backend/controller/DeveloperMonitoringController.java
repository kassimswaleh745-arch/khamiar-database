package com.khamiar.backend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/technical/monitoring")
@PreAuthorize("hasRole('DEVELOPER')")
public class DeveloperMonitoringController {

    private final JdbcTemplate jdbc;

    public DeveloperMonitoringController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/reports")
    public List<Map<String, Object>> reports() {
        return jdbc.queryForList("""
            SELECT
                DATE_FORMAT(travel_date, '%Y-%m') AS period,
                COUNT(*) AS records
            FROM customers
            WHERE deleted_at IS NULL
            GROUP BY DATE_FORMAT(travel_date, '%Y-%m')
            ORDER BY period DESC
            """);
    }

    @GetMapping("/staff")
    public List<Map<String, Object>> staff() {
        return jdbc.queryForList("""
            SELECT
                role AS role,
                CASE WHEN active = 1
                    THEN 'ACTIVE'
                    ELSE 'INACTIVE'
                END AS status,
                COUNT(*) AS accounts
            FROM users
            GROUP BY role, active
            ORDER BY role
            """);
    }

    @GetMapping("/recycle-bin")
    public List<Map<String, Object>> recycleBin() {
        return jdbc.queryForList("""
            SELECT
                DATE(deleted_at) AS deletedDate,
                COUNT(*) AS records
            FROM customers
            WHERE deleted_at IS NOT NULL
            GROUP BY DATE(deleted_at)
            ORDER BY deletedDate DESC
            """);
    }

    @GetMapping("/audit")
    public List<Map<String, Object>> audit() {
        return jdbc.queryForList("""
            SELECT
                action AS action,
                COUNT(*) AS events
            FROM audit_logs
            GROUP BY action
            ORDER BY events DESC
            """);
    }
}
