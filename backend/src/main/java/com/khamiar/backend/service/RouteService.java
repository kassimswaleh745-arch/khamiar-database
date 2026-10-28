package com.khamiar.backend.service;

import com.khamiar.backend.dto.ManifestResponse;
import com.khamiar.backend.dto.RouteRequest;
import com.khamiar.backend.dto.RouteResponse;
import com.khamiar.backend.dto.StockRequest;
import com.khamiar.backend.entity.Customer;
import com.khamiar.backend.entity.TicketStockEntry;
import com.khamiar.backend.entity.TravelRoute;
import com.khamiar.backend.repository.CustomerRepository;
import com.khamiar.backend.repository.TicketStockRepository;
import com.khamiar.backend.repository.TravelRouteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class RouteService {

    private final TravelRouteRepository routes;
    private final TicketStockRepository stockRepository;
    private final CustomerRepository customers;
    private final TicketService tickets;
    private final AuditService audit;

    public RouteService(TravelRouteRepository routes, TicketStockRepository stockRepository,
                        CustomerRepository customers, TicketService tickets, AuditService audit) {
        this.routes = routes;
        this.stockRepository = stockRepository;
        this.customers = customers;
        this.tickets = tickets;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<RouteResponse> list(boolean admin) {
        return routes.findAllByOrderByNameAsc().stream()
                .filter(r -> admin || r.isActive())
                .map(r -> toResponse(r, admin))
                .toList();
    }

    @Transactional
    public RouteResponse create(RouteRequest request, String actor) {
        String name = request.name().trim();
        if (routes.findByNameIgnoreCase(name).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A route with this name already exists");
        }
        TravelRoute route = new TravelRoute();
        route.setName(name);
        route.setCustomerPrice(request.customerPrice());
        route.setSystemPrice(request.systemPrice());
        route.setActive(request.active() == null || request.active());
        TravelRoute saved = routes.save(route);
        audit.log(actor, "ROUTE_CREATED", "'" + name + "' price " + saved.getCustomerPrice());
        return toResponse(saved, true);
    }

    @Transactional
    public RouteResponse update(Long id, RouteRequest request, String actor) {
        TravelRoute route = getOrThrow(id);
        String name = request.name().trim();
        if (routes.findByNameIgnoreCase(name).filter(r -> !r.getId().equals(id)).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A route with this name already exists");
        }
        String before = route.getName() + " price " + route.getCustomerPrice() + " active=" + route.isActive();
        route.setName(name);
        route.setCustomerPrice(request.customerPrice());
        route.setSystemPrice(request.systemPrice());
        if (request.active() != null) {
            route.setActive(request.active());
        }
        TravelRoute saved = routes.save(route);
        audit.log(actor, "ROUTE_UPDATED", "Was: " + before + " | Now: " + saved.getName()
                + " price " + saved.getCustomerPrice() + " active=" + saved.isActive());
        return toResponse(saved, true);
    }

    @Transactional
    public RouteResponse addStock(Long id, StockRequest request, String actor) {
        TravelRoute route = routes.findForUpdate(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));

        int quantity = request.quantity();
        if (quantity == 0 || Math.abs(quantity) > 100000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Quantity must be a non-zero number up to 100000");
        }
        int issued = tickets.issuedOf(id);
        if (tickets.stockOf(id) + quantity < issued) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stock cannot be lower than the tickets already issued (" + issued + ")");
        }

        TicketStockEntry entry = new TicketStockEntry();
        entry.setRouteId(id);
        entry.setQuantity(quantity);
        entry.setNote(request.note() == null || request.note().isBlank() ? null : request.note().trim());
        entry.setCreatedBy(actor);
        stockRepository.save(entry);

        audit.log(actor, quantity > 0 ? "STOCK_ADDED" : "STOCK_REDUCED",
                "'" + route.getName() + "' " + (quantity > 0 ? "+" : "") + quantity);
        return toResponse(route, true);
    }

    @Transactional(readOnly = true)
    public ManifestResponse manifest(Long id, LocalDate date, boolean admin) {
        TravelRoute route = getOrThrow(id);
        List<Customer> list = (date == null)
                ? customers.findByRouteIdOrderByTravelDateAscIdAsc(id)
                : customers.findByRouteIdAndTravelDateOrderByIdAsc(id, date);
        return new ManifestResponse(toResponse(route, admin), date,
                list.stream().map(CustomerMapper::toResponse).toList());
    }

    private TravelRoute getOrThrow(Long id) {
        return routes.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));
    }

    private RouteResponse toResponse(TravelRoute r, boolean admin) {
        int stock = tickets.stockOf(r.getId());
        int issued = tickets.issuedOf(r.getId());
        return new RouteResponse(r.getId(), r.getName(), r.getCustomerPrice(),
                admin ? r.getSystemPrice() : null, r.isActive(),
                stock, issued, tickets.usedOf(r.getId()), stock - issued);
    }
}
