package com.khamiar.backend.service;

import com.khamiar.backend.dto.CustomerResponse;
import com.khamiar.backend.entity.Customer;

public final class CustomerMapper {

    private CustomerMapper() {}

    public static CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(
                c.getId(), c.getCustomerName(), c.getTravelDate(), c.getRoute(), c.getPhone(),
                c.getSystemAmount(), c.getCustomerAmount(), c.getProfit(),
                c.getCreatedAt(), c.getCreatedBy(), c.getEmail(),
                c.getRouteId(), c.getTicketCount(), c.getTicketStatus());
    }
}
