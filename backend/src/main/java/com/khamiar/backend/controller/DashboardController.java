package com.khamiar.backend.controller;

import com.khamiar.backend.dto.DashboardResponse;
import com.khamiar.backend.dto.DepartureResponse;
import com.khamiar.backend.service.DashboardService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardResponse get(Authentication auth) {
        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return service.build(auth.getName(), admin);
    }

    @GetMapping("/departures")
    public List<DepartureResponse> departures(@RequestParam(defaultValue = "7") int days) {
        return service.departures(days);
    }
}
