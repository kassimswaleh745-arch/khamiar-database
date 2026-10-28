package com.khamiar.backend.dto;

import com.khamiar.backend.entity.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotNull(message = "Role is required") Role role,
        @NotNull(message = "Status (active) is required") Boolean active
) {}
