package com.khamiar.backend.service;

import com.khamiar.backend.dto.CreateUserRequest;
import com.khamiar.backend.dto.ResetPasswordRequest;
import com.khamiar.backend.dto.UpdateUserRequest;
import com.khamiar.backend.dto.UserResponse;
import com.khamiar.backend.entity.Role;
import com.khamiar.backend.entity.User;
import com.khamiar.backend.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder encoder;
    private final AuditService audit;

    public UserService(UserRepository repository, PasswordEncoder encoder, AuditService audit) {
        this.repository = repository;
        this.encoder = encoder;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return repository.findAll(Sort.by("id")).stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request, String actor) {
        String email = clean(request.email());
        String username = clean(request.username());
        if (username == null) username = email;
        if (username == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a username or an email");
        }
        if (repository.findByUsernameIgnoreCase(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (repository.findByEmailIgnoreCase(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (email != null && repository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }

        User user = new User();
        user.setUsername(username);
        user.setFullName(clean(request.fullName()));
        user.setEmail(email);
        user.setPassword(encoder.encode(request.password()));
        user.setRole(request.role());
        User saved = repository.save(user);

        audit.log(actor, "USER_CREATED", "Created " + saved.getRole() + " account '" + username + "'");
        return toResponse(saved);
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request, String currentUsername) {
        User user = getOrThrow(id);

        boolean isSelf = user.getUsername().equalsIgnoreCase(currentUsername);
        if (isSelf && (request.role() != Role.ADMIN || !request.active())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot demote or disable your own account");
        }

        user.setRole(request.role());
        user.setActive(request.active());
        User saved = repository.save(user);

        audit.log(currentUsername, "USER_UPDATED",
                "'" + saved.getUsername() + "': role=" + saved.getRole() + ", active=" + saved.isActive());
        return toResponse(saved);
    }

    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request, String actor) {
        User user = getOrThrow(id);
        user.setPassword(encoder.encode(request.password()));
        repository.save(user);
        audit.log(actor, "PASSWORD_RESET", "Reset password for '" + user.getUsername() + "'");
    }

    private User getOrThrow(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(),
                u.getRole(), u.isActive(), u.getCreatedAt());
    }
}
