package com.khamiar.backend.controller;

import com.khamiar.backend.dto.LockRequest;
import com.khamiar.backend.service.SystemService;
import com.khamiar.backend.service.AuditService;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final SystemService service;
    private final AuditService audit;

    public SystemController(
            SystemService service,
            AuditService audit) {

        this.service = service;
        this.audit = audit;
    }

    @GetMapping("/maintenance")
    public Map<String, Object> maintenance() {
        return service.maintenanceStatus();
    }

    @Transactional
    @PostMapping("/reopening-request")
    public Map<String, Object> requestReopening(
            Authentication auth,
            HttpServletRequest http) {

        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!admin) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Administrator access is required");
        }

        boolean created = service.requestReopening(auth.getName());

        if (created) {
            audit.log(
                    auth.getName(),
                    "REOPENING_REQUESTED",
                    "Administrator requested maintenance reopening",
                    http.getRemoteAddr());
        }

        return Map.of(
                "status", "PENDING",
                "created", created);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {

        return Map.of("locked", service.isLocked());
    }

    @Transactional
    @PutMapping("/lock")
    public Map<String, Object> lock(
            @Valid @RequestBody LockRequest request,
            Authentication auth,
            HttpServletRequest http) {

        boolean developer = auth.getAuthorities().stream()
                .anyMatch(a ->
                    a.getAuthority().equals("ROLE_DEVELOPER"));

        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a ->
                    a.getAuthority().equals("ROLE_ADMIN"));

        boolean requested = request.locked();

        if (!(admin || (developer && !requested))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to perform this action.");
        }

        boolean current = service.isLocked();

        if (current == requested) {
            return Map.of(
                    "locked", current,
                    "changed", false);
        }

        boolean locked = service.setLocked(requested);

        String action = locked
                ? "MAINTENANCE_ENABLED"
                : admin
                    ? "SYSTEM_RECOVERY"
                    : "MAINTENANCE_DISABLED";

        audit.log(
                auth.getName(),
                action,
                locked
                    ? "Employee operations temporarily restricted"
                    : "Normal employee access restored",
                http.getRemoteAddr());

        return Map.of(
                "locked", locked,
                "changed", true);
    }
}
