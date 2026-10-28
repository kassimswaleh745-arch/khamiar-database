package com.khamiar.backend.controller;

import com.khamiar.backend.dto.ChangePasswordRequest;
import com.khamiar.backend.dto.ProfileResponse;
import com.khamiar.backend.dto.UpdateProfileRequest;
import com.khamiar.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping
    public ProfileResponse get(Authentication auth) {
        return service.get(auth.getName());
    }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody UpdateProfileRequest request, Authentication auth) {
        return service.update(auth.getName(), request);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication auth) {
        service.changePassword(auth.getName(), request);
    }
}
