package com.khamiar.backend.service;

import com.khamiar.backend.entity.TicketStatus;
import com.khamiar.backend.repository.CustomerRepository;
import com.khamiar.backend.repository.TicketStockRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Total = stock iliyowekwa na admin
 * Issued = zilizotolewa kwa wateja (ISSUED + USED)
 * Used = wateja waliosafiri (USED)
 * Remaining = Total - Issued (tiketi iliyofutwa inarudi kwenye stock)
 */
@Service
public class TicketService {

    private static final List<TicketStatus> SOLD = List.of(TicketStatus.ISSUED, TicketStatus.USED);
    private static final List<TicketStatus> USED = List.of(TicketStatus.USED);

    private final TicketStockRepository stock;
    private final CustomerRepository customers;

    public TicketService(TicketStockRepository stock, CustomerRepository customers) {
        this.stock = stock;
        this.customers = customers;
    }

    public int stockOf(Long routeId) { return n(stock.totalFor(routeId)); }

    public int issuedOf(Long routeId) { return n(customers.sumTickets(routeId, SOLD)); }

    public int usedOf(Long routeId) { return n(customers.sumTickets(routeId, USED)); }

    public int remainingOf(Long routeId) { return stockOf(routeId) - issuedOf(routeId); }

    private static int n(Long value) { return value == null ? 0 : value.intValue(); }
}
