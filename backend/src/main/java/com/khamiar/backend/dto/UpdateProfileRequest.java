package com.khamiar.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100, message = "Full name is too long")
        String fullName,

        @Email(message = "Enter a valid email address")
        @Size(max = 150, message = "Email is too long")
        String email,

        @Size(max = 30, message = "Phone is too long")
        String phone) {}
