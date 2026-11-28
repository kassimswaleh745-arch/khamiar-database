package com.khamiar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserProfileRequest(

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name is too long")
    String fullName,

    @Email(message = "Enter a valid email address")
    @Size(max = 150, message = "Email is too long")
    String email

) {}
