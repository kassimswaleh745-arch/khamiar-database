package com.khamiar.backend.controller;

import com.khamiar.backend.dto.CreateUserRequest;
import com.khamiar.backend.dto.ResetPasswordRequest;
import com.khamiar.backend.dto.UpdateUserRequest;
import com.khamiar.backend.dto.UserResponse;
import com.khamiar.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping
    public List<UserResponse> list() {
        return service.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request, Authentication auth) {
        return service.create(request, auth.getName());
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id,
                               @Valid @RequestBody UpdateUserRequest request,
                               Authentication auth) {
        return service.update(id, request, auth.getName());
    }

    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id,
                              @Valid @RequestBody ResetPasswordRequest request,
                              Authentication auth) {
        service.resetPassword(id, request, auth.getName());
    }
}
