package com.khamiar.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Email or username is required")
        @Size(max = 150, message = "Email or username is too long")
        String username,

        @NotBlank(message = "Password is required")
        @Size(max = 100, message = "Password is too long")
        String password
) {}
