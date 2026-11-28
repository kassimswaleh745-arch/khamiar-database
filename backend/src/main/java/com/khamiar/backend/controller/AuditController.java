package com.khamiar.backend.controller;

import com.khamiar.backend.dto.AuditLogResponse;
import com.khamiar.backend.service.AuditService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.time.LocalDate;
import com.khamiar.backend.dto.AuditPageResponse;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService service;

    public AuditController(AuditService service) {
        this.service = service;
    }


    @GetMapping("/search")
    public AuditPageResponse search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        boolean admin = auth != null &&
            auth.getAuthorities().stream().anyMatch(
                a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!admin) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Administrator access required");
        }

        return service.search(
            search, action, from, to, page, size);
    }

    @GetMapping
    public List<AuditLogResponse> recent(@RequestParam(defaultValue = "20") int limit) {
        return service.recent(limit);
    }
}
