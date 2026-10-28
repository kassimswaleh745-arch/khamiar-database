package com.khamiar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CustomerRequest(

    @NotBlank(message = "Customer name is required")
    @Size(max = 150, message = "Name is too long")
    String customerName,

    @NotNull(message = "Travel date is required")
    LocalDate travelDate,

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[0-9 ]{9,16}$",
        message = "Enter a valid phone number"
    )
    String phone,

    @Email(message = "Enter a valid email address")
    @Size(max = 150, message = "Email is too long")
    String email,

    @NotNull(message = "Select a travel route")
    Long routeId,

    @NotNull(message = "Number of tickets is required")
    @Min(value = 1, message = "At least 1 ticket is required")
    @Max(value = 20, message = "At most 20 tickets per customer")
    Integer ticketCount

) {}
