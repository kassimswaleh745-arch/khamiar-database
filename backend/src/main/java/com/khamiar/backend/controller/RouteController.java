package com.khamiar.backend.controller;

import com.khamiar.backend.dto.ManifestResponse;
import com.khamiar.backend.dto.RouteRequest;
import com.khamiar.backend.dto.RouteResponse;
import com.khamiar.backend.dto.StockRequest;
import com.khamiar.backend.service.RouteService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService service;

    public RouteController(RouteService service) {
        this.service = service;
    }

    @GetMapping
    public List<RouteResponse> list(Authentication auth) {
        return service.list(isAdmin(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RouteResponse create(@Valid @RequestBody RouteRequest request, Authentication auth) {
        return service.create(request, auth.getName());
    }

    @PutMapping("/{id}")
    public RouteResponse update(@PathVariable Long id, @Valid @RequestBody RouteRequest request,
                                Authentication auth) {
        return service.update(id, request, auth.getName());
    }

    @PostMapping("/{id}/stock")
    public RouteResponse addStock(@PathVariable Long id, @Valid @RequestBody StockRequest request,
                                  Authentication auth) {
        return service.addStock(id, request, auth.getName());
    }

    @GetMapping("/{id}/manifest")
    public ManifestResponse manifest(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication auth) {
        return service.manifest(id, date, isAdmin(auth));
    }

    private static boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
