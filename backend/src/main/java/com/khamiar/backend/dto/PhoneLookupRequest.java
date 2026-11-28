package com.khamiar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record PhoneLookupRequest(

    @NotBlank(message = "Phone number is required")
    @Size(max = 30, message = "Phone number is too long")
    @Pattern(
        regexp = "^\\+?[0-9]+(?: [0-9]+)*$",
        message = "Invalid phone number format"
    )
    String phone

) {}
