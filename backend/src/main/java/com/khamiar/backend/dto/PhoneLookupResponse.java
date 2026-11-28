package com.khamiar.backend.dto;

public record PhoneLookupResponse(

    boolean returningCustomer,

    String customerName,

    long previousBookings

) {}
