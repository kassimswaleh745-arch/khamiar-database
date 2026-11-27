package com.khamiar.backend.service;

import com.khamiar.backend.dto.CustomerResponse;
import com.khamiar.backend.entity.Customer;

public final class CustomerMapper {

    private CustomerMapper() {}

    public static CustomerResponse toResponse(Customer c) {
        var authentication =
            org.springframework.security.core.context
                .SecurityContextHolder.getContext()
                .getAuthentication();

        boolean admin = authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        return new CustomerResponse(
                c.getId(), c.getCustomerName(), c.getTravelDate(), c.getRoute(), c.getPhone(),
                admin ? c.getSystemAmount() : null,
                c.getCustomerAmount(),
                admin ? c.getProfit() : null,
                c.getCreatedAt(), c.getCreatedBy(), c.getEmail(),
                c.getRouteId(), c.getTicketCount(), c.getTicketStatus(),
                c.getBookingReference());
    }
}
