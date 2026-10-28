package com.khamiar.backend.controller;

import com.khamiar.backend.dto.AuditLogResponse;
import com.khamiar.backend.service.AuditService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService service;

    public AuditController(AuditService service) {
        this.service = service;
    }

    @GetMapping
    public List<AuditLogResponse> recent(@RequestParam(defaultValue = "20") int limit) {
        return service.recent(limit);
    }
}
