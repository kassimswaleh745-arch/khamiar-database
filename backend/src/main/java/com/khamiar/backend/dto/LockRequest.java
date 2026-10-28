package com.khamiar.backend.dto;

import jakarta.validation.constraints.NotNull;

public record LockRequest(
        @NotNull(message = "Locked status is required") Boolean locked
) {}
