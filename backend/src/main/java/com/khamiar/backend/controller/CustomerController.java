package com.khamiar.backend.controller;

import com.khamiar.backend.dto.CustomerRequest;
import com.khamiar.backend.dto.CustomerResponse;
import com.khamiar.backend.dto.TicketStatusRequest;
import com.khamiar.backend.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public List<CustomerResponse> list(@RequestParam(required = false) String search) {
        return service.findAll(search);
    }

    @GetMapping("/{id}")
    public CustomerResponse get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse create(@Valid @RequestBody CustomerRequest request, Authentication auth) {
        return service.create(request, auth.getName());
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id,
                                   @Valid @RequestBody CustomerRequest request,
                                   Authentication auth) {
        return service.update(id, request, auth.getName(), isAdmin(auth));
    }

    @PutMapping("/{id}/ticket-status")
    public CustomerResponse ticketStatus(@PathVariable Long id,
                                         @Valid @RequestBody TicketStatusRequest request,
                                         Authentication auth) {
        return service.changeTicketStatus(id, request.status(), auth.getName(), isAdmin(auth));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth) {
        service.delete(id, auth.getName());
    }

    private static boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
