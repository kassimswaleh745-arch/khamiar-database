package com.khamiar.backend.service;

import com.khamiar.backend.dto.DashboardResponse;
import com.khamiar.backend.dto.DepartureResponse;
import com.khamiar.backend.entity.Customer;
import com.khamiar.backend.entity.TicketStatus;
import com.khamiar.backend.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.function.Function;

@Service
public class DashboardService {

    private static final ZoneId ZONE = ZoneId.of("Africa/Dar_es_Salaam");

    private final CustomerRepository repository;

    public DashboardService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse build(String username, boolean admin) {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());
        String month = YearMonth.from(today).toString();

        if (admin) {
            return new DashboardResponse(
                    repository.count(),
                    nz(repository.sumCustomerAmount()),
                    nz(repository.sumSystemAmount()),
                    nz(repository.sumProfit()),
                    repository.countByTravelDate(today),
                    repository.countByTravelDateBetween(monthStart, monthEnd),
                    nz(repository.sumProfitBetween(monthStart, monthEnd)),
                    month, false);
        }

        // Staff: takwimu za rekodi zake mwenyewe (bila zilizofutwa); wanaosafiri leo ni wa kampuni nzima
        List<Customer> mine = repository.findByCreatedByOrderByIdDesc(username).stream()
                .filter(DashboardService::active).toList();
        List<Customer> thisMonth = mine.stream()
                .filter(c -> !c.getTravelDate().isBefore(monthStart) && !c.getTravelDate().isAfter(monthEnd))
                .toList();
        return new DashboardResponse(
                mine.size(),
                sum(mine, Customer::getCustomerAmount),
                sum(mine, Customer::getSystemAmount),
                sum(mine, Customer::getProfit),
                repository.countByTravelDate(today),
                thisMonth.size(),
                sum(thisMonth, Customer::getProfit),
                month, true);
    }

    /** Wanaosafiri kuanzia leo hadi siku N mbele. Wafanyakazi wote wanaiona, bila pesa. */
    @Transactional(readOnly = true)
    public List<DepartureResponse> departures(int days) {
        LocalDate today = LocalDate.now(ZONE);
        int span = Math.max(0, Math.min(days, 30));
        return repository.findByTravelDateBetweenOrderByTravelDateAscIdAsc(today, today.plusDays(span)).stream()
                .filter(DashboardService::active)
                .map(c -> new DepartureResponse(c.getId(), c.getCustomerName(), c.getTravelDate(),
                        c.getRoute(), c.getPhone(), c.getTicketCount(), c.getTicketStatus(), c.getCreatedBy()))
                .toList();
    }

    private static boolean active(Customer c) {
        return c.getTicketStatus() != TicketStatus.CANCELLED;
    }

    private static BigDecimal sum(List<Customer> list, Function<Customer, BigDecimal> f) {
        return list.stream().map(f).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
