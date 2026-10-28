package com.khamiar.backend.dto;

import com.khamiar.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be 3 to 50 characters")
        @Pattern(regexp = "^[A-Za-z0-9._-]+$",
                 message = "Use only letters, numbers, dots, underscores or hyphens")
        String username,

        @Size(max = 100, message = "Full name is too long")
        String fullName,

        @Email(message = "Enter a valid email address")
        @Size(max = 150, message = "Email is too long")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be 8 to 100 characters")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).*$",
                 message = "Password must include at least one letter and one number")
        String password,

        @NotNull(message = "Role is required")
        Role role
) {}
