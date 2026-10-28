package com.khamiar.backend.service;

import com.khamiar.backend.dto.CustomerRequest;
import com.khamiar.backend.dto.CustomerResponse;
import com.khamiar.backend.entity.Customer;
import com.khamiar.backend.entity.TicketStatus;
import com.khamiar.backend.entity.TravelRoute;
import com.khamiar.backend.repository.CustomerRepository;
import com.khamiar.backend.repository.TravelRouteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class CustomerService {

    private static final ZoneId ZONE = ZoneId.of("Africa/Dar_es_Salaam");

    private final CustomerRepository repository;
    private final TravelRouteRepository routes;
    private final TicketService tickets;
    private final AuditService audit;
    public CustomerService(CustomerRepository repository, TravelRouteRepository routes,
                           TicketService tickets, AuditService audit) {
        this.repository = repository;
        this.routes = routes;
        this.tickets = tickets;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> findAll(String search) {
        List<Customer> customers;
        if (search == null || search.isBlank()) {
            customers = repository.findAllByOrderByIdDesc();
        } else {
            String term = search.trim();
            customers = repository
                    .findByCustomerNameContainingIgnoreCaseOrPhoneContainingOrderByIdDesc(term, term);
        }
        return customers.stream().map(CustomerMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(Long id) {
        return CustomerMapper.toResponse(getOrThrow(id));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest r, String actor) {
        TravelRoute route = lockActiveRoute(r.routeId());
        int quantity = r.ticketCount();

        ensureTravelDateAllowed(r.travelDate(), null);
        int remaining = tickets.remainingOf(route.getId());
        if (quantity > remaining) {
            throw bad("Only " + remaining + " ticket(s) remaining for this route");
        }
        String phone = normalizePhone(r.phone());
        ensureNotDuplicate(phone, route.getId(), r.travelDate(), -1L);

        Customer c = new Customer();
        c.setCreatedBy(actor);
        c.setTicketStatus(TicketStatus.ISSUED);
        apply(c, r, route, phone);
        Customer saved = repository.save(c);

        audit.log(actor, "TICKET_ISSUED", "#" + saved.getId() + " " + saved.getCustomerName()
                + " | " + route.getName() + " x" + quantity);
        return CustomerMapper.toResponse(saved);
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest r, String actor, boolean admin) {
        Customer c = getOrThrow(id);

        if (!admin) {
            if (c.getCreatedBy() == null || !c.getCreatedBy().equalsIgnoreCase(actor)) {
                throw forbidden("You can only edit customers you added");
            }
            if (c.getTicketStatus() != null && c.getTicketStatus() != TicketStatus.ISSUED) {
                throw forbidden("This ticket has already been used or cancelled");
            }
        }
        if (c.getTicketStatus() == TicketStatus.CANCELLED) {
            throw bad("Cancelled tickets cannot be edited");
        }

        TravelRoute route = lockActiveRoute(r.routeId());
        int quantity = r.ticketCount();

        ensureTravelDateAllowed(r.travelDate(), c.getTravelDate());
        boolean sameRoute = c.getTicketStatus() != null && c.getTicketCount() != null
                && route.getId().equals(c.getRouteId());
        int available = tickets.remainingOf(route.getId()) + (sameRoute ? c.getTicketCount() : 0);
        if (quantity > available) {
            throw bad("Only " + available + " ticket(s) available for this route");
        }
        String phone = normalizePhone(r.phone());
        ensureNotDuplicate(phone, route.getId(), r.travelDate(), c.getId());

        if (c.getTicketStatus() == null) {
            c.setTicketStatus(TicketStatus.ISSUED);
        }
        apply(c, r, route, phone);
        Customer saved = repository.save(c);

        audit.log(actor, "CUSTOMER_UPDATED", "#" + saved.getId() + " " + saved.getCustomerName()
                + " | " + route.getName() + " x" + quantity);
        return CustomerMapper.toResponse(saved);
    }

    @Transactional
    public CustomerResponse changeTicketStatus(Long id, TicketStatus target, String actor, boolean admin) {
        Customer c = getOrThrow(id);
        TicketStatus current = c.getTicketStatus();
        if (current == null) {
            throw bad("This record has no ticket");
        }

        switch (target) {
            case USED -> {
                if (current != TicketStatus.ISSUED) {
                    throw bad("Only an issued ticket can be marked as used");
                }
                if (c.getTravelDate().isAfter(LocalDate.now(ZONE))) {
                    throw bad("A ticket can only be marked as used on or after the travel date");
                }
            }
            case CANCELLED -> {
                if (!admin) throw forbidden("Only an administrator can cancel a ticket");
                if (current != TicketStatus.ISSUED) throw bad("Only an issued ticket can be cancelled");
            }
            case ISSUED -> {
                if (!admin) throw forbidden("Only an administrator can reopen a ticket");
                if (current != TicketStatus.USED) throw bad("Only a used ticket can be reopened");
            }
        }

        c.setTicketStatus(target);
        Customer saved = repository.save(c);
        audit.log(actor, "TICKET_" + target.name(), "#" + saved.getId() + " " + saved.getCustomerName());
        return CustomerMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id, String actor) {
        Customer c = getOrThrow(id);
        String label = "#" + c.getId() + " " + c.getCustomerName();
        repository.delete(c);
        audit.log(actor, "CUSTOMER_DELETED", label);
    }

    private Customer getOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    private TravelRoute lockActiveRoute(Long routeId) {
        return routes.findForUpdate(routeId)
                .filter(TravelRoute::isActive)
                .orElseThrow(() -> bad("The selected route is not available"));
    }

    private void ensureNotDuplicate(String phone, Long routeId, LocalDate date, Long excludeId) {
        if (repository.existsByPhoneAndRouteIdAndTravelDateAndTicketStatusNotAndIdNot(
                phone, routeId, date, TicketStatus.CANCELLED, excludeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A ticket for this phone number, route and travel date already exists");
        }
    }

    /** Kiasi kinahesabiwa na seva kutoka kwenye bei ya route, si na mtumiaji */
    private void apply(Customer c, CustomerRequest r, TravelRoute route, String phone) {
        int quantity = r.ticketCount();
        BigDecimal q = BigDecimal.valueOf(quantity);
        BigDecimal customerAmount = route.getCustomerPrice().multiply(q);
        BigDecimal systemAmount = route.getSystemPrice().multiply(q);

        c.setCustomerName(r.customerName().trim());
        c.setTravelDate(r.travelDate());
        c.setPhone(phone);
        c.setEmail(clean(r.email()));
        c.setRouteId(route.getId());
        c.setRoute(route.getName());
        c.setTicketCount(quantity);
        c.setCustomerAmount(customerAmount);
        c.setSystemAmount(systemAmount);
        c.setProfit(customerAmount.subtract(systemAmount));
    }

    /** Past travel dates are not allowed. An old record may be edited as long as its date is unchanged. */
    private static void ensureTravelDateAllowed(LocalDate requested, LocalDate existing) {
        boolean unchanged = existing != null && existing.equals(requested);
        if (requested.isBefore(LocalDate.now(ZONE)) && !unchanged) {
            throw bad("Travel date cannot be in the past");
        }
    }

    private static String normalizePhone(String phone) {
        return phone.replaceAll("\\s+", "");
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }
}
