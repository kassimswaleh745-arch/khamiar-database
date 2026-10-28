package com.khamiar.backend.controller;

import com.khamiar.backend.dto.StaffOverviewResponse;
import com.khamiar.backend.service.StaffService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService service;

    public StaffController(StaffService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    public StaffOverviewResponse overview() {
        return service.overview();
    }
}
