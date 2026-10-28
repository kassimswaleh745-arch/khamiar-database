package com.khamiar.backend.dto;

import com.khamiar.backend.entity.Role;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StaffRow(
        Long id,
        String username,
        String fullName,
        Role role,
        boolean active,
        String status,          // WORKING | SUSPENDED
        LocalDate leaveUntil,
        long customers,
        long tickets,
        BigDecimal profit) {}
