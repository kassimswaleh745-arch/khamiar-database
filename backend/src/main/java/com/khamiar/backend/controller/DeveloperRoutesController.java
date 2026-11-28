package com.khamiar.backend.controller;

import com.khamiar.backend.service.RouteService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technical/routes")
public class DeveloperRoutesController {

    private final RouteService service;

    public DeveloperRoutesController(RouteService service) {
        this.service = service;
    }

    @GetMapping
    public List<?> routes() {
        return service.list(false);
    }
}
