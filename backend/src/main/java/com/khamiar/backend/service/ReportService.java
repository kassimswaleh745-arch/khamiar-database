package com.khamiar.backend.service;

import com.khamiar.backend.dto.CustomerResponse;
import com.khamiar.backend.dto.ReportResponse;
import com.khamiar.backend.entity.Customer;
import com.khamiar.backend.entity.TicketStatus;
import com.khamiar.backend.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.function.Function;

@Service
public class ReportService {

    private static final ZoneId ZONE = ZoneId.of("Africa/Dar_es_Salaam");

    private final CustomerRepository repository;

    public ReportService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ReportResponse build(LocalDate from, LocalDate to, String requestedEmployee,
                                String username, boolean admin) {
        if (from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The start date must be on or before the end date");
        }
        if (ChronoUnit.DAYS.between(from, to) > 366) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The period must not exceed one year");
        }

        // Employee anaona zake tu (inalazimishwa hapa, si kwenye React).
        // Admin anaweza kuchagua mfanyakazi, au kuacha wazi kuona wote.
        String employee;
        if (!admin) {
            employee = username;
        } else {
            employee = (requestedEmployee == null || requestedEmployee.isBlank())
                    ? null : requestedEmployee.trim();
        }

        List<Customer> customers = (employee == null)
                ? repository.findByTravelDateBetweenOrderByTravelDateAscIdAsc(from, to)
                : repository.findByTravelDateBetweenAndCreatedByOrderByTravelDateAscIdAsc(from, to, employee);

        // Tiketi zilizofutwa hazihesabiwi kwenye ripoti
        List<CustomerResponse> rows = customers.stream()
                .filter(c -> c.getTicketStatus() != TicketStatus.CANCELLED)
                .map(CustomerMapper::toResponse).toList();

        return new ReportResponse(
                from, to, employee, username, LocalDateTime.now(ZONE), rows.size(),
                sum(rows, CustomerResponse::systemAmount),
                sum(rows, CustomerResponse::customerAmount),
                sum(rows, CustomerResponse::profit),
                rows);
    }

    private static BigDecimal sum(List<CustomerResponse> rows, Function<CustomerResponse, BigDecimal> f) {
        return rows.stream().map(f).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
