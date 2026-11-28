package com.khamiar.backend.controller;

import com.khamiar.backend.repository.CustomerRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/technical/customers")
public class DeveloperCustomerController {

    private final CustomerRepository repository;

    public DeveloperCustomerController(
            CustomerRepository repository) {
        this.repository = repository;
    }

    public record CustomerMonitoringResponse(
            Long id,
            String route,
            LocalDate travelDate,
            Integer ticketCount,
            String ticketStatus
    ) {}

    @GetMapping
    @PreAuthorize("hasRole('DEVELOPER')")
    public List<CustomerMonitoringResponse> list() {

        return repository.findAll()
                .stream()
                .map(c -> new CustomerMonitoringResponse(
                        c.getId(),
                        c.getRoute(),
                        c.getTravelDate(),
                        c.getTicketCount(),
                        c.getTicketStatus() == null
                            ? null
                            : c.getTicketStatus().name()
                ))
                .toList();
    }
}
