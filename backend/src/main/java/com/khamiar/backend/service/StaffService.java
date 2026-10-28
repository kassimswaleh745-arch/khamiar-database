
package com.khamiar.backend.service;

import com.khamiar.backend.dto.StaffOverviewResponse;
import com.khamiar.backend.dto.StaffRow;
import com.khamiar.backend.entity.Customer;
import com.khamiar.backend.entity.Role;
import com.khamiar.backend.entity.TicketStatus;
import com.khamiar.backend.entity.User;
import com.khamiar.backend.repository.CustomerRepository;
import com.khamiar.backend.repository.UserRepository;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class StaffService {

    private final UserRepository users;
    private final CustomerRepository customers;

    public StaffService(
            UserRepository users,
            CustomerRepository customers
    ) {
        this.users = users;
        this.customers = customers;
    }

    /**
     * Staff overview for Admin.
     * Leave Management has been removed.
     */
    @Transactional(readOnly = true)
    public StaffOverviewResponse overview() {

        Map<String, long[]> work = new HashMap<>();
        Map<String, BigDecimal> profit = new HashMap<>();

        // Calculate customers, tickets and profit
        for (Customer c : customers.findAll()) {

            if (c.getCreatedBy() == null ||
                c.getTicketStatus() == TicketStatus.CANCELLED) {
                continue;
            }

            String key = c.getCreatedBy()
                    .toLowerCase(Locale.ROOT);

            long[] w = work.computeIfAbsent(
                    key, k -> new long[2]
            );

            w[0] += 1;

            w[1] += c.getTicketCount() == null
                    ? 0
                    : c.getTicketCount();

            profit.merge(
                    key,
                    c.getProfit(),
                    BigDecimal::add
            );
        }

        List<StaffRow> rows = new ArrayList<>();

        int total = 0;
        int working = 0;
        int suspended = 0;
        int admins = 0;

        // Staff status without Leave
        for (User u : users.findAll(Sort.by("id"))) {

            String key = u.getUsername()
                    .toLowerCase(Locale.ROOT);

            String status = u.isActive()
                    ? "WORKING"
                    : "SUSPENDED";

            if (u.getRole() == Role.EMPLOYEE) {

                total++;

                if (u.isActive()) {
                    working++;
                } else {
                    suspended++;
                }

            } else {
                admins++;
            }

            long[] w = work.getOrDefault(
                    key, new long[2]
            );

            rows.add(new StaffRow(
                    u.getId(),
                    u.getUsername(),
                    u.getFullName(),
                    u.getRole(),
                    u.isActive(),
                    status,
                    null,
                    w[0],
                    w[1],
                    profit.getOrDefault(
                            key,
                            BigDecimal.ZERO
                    )
            ));
        }

        // Keep the existing response format for compatibility.
        return new StaffOverviewResponse(
                total,
                working,
                suspended,
                admins,
                rows
        );
    }
}
