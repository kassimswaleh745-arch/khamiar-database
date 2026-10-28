package com.khamiar.backend.controller;

import com.khamiar.backend.dto.LockRequest;
import com.khamiar.backend.service.SystemService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final SystemService service;

    public SystemController(SystemService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("locked", service.isLocked());
    }

    @PutMapping("/lock")
    public Map<String, Object> lock(@Valid @RequestBody LockRequest request) {
        return Map.of("locked", service.setLocked(request.locked()));
    }
}
