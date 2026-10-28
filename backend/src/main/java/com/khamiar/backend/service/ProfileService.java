package com.khamiar.backend.service;

import com.khamiar.backend.dto.ChangePasswordRequest;
import com.khamiar.backend.dto.ProfileResponse;
import com.khamiar.backend.dto.UpdateProfileRequest;
import com.khamiar.backend.entity.User;
import com.khamiar.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

    private final UserRepository repository;
    private final PasswordEncoder encoder;
    private final AuditService audit;

    public ProfileService(UserRepository repository, PasswordEncoder encoder, AuditService audit) {
        this.repository = repository;
        this.encoder = encoder;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(String username) {
        return toResponse(find(username));
    }

    @Transactional
    public ProfileResponse update(String username, UpdateProfileRequest request) {
        User user = find(username);
        String email = clean(request.email());
        if (email != null) {
            repository.findByEmailIgnoreCase(email)
                    .filter(other -> !other.getId().equals(user.getId()))
                    .ifPresent(o -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use"); });
            repository.findByUsernameIgnoreCase(email)
                    .filter(other -> !other.getId().equals(user.getId()))
                    .ifPresent(o -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use"); });
        }
        user.setFullName(clean(request.fullName()));
        user.setEmail(email);
        user.setPhone(clean(request.phone()));
        User saved = repository.save(user);
        audit.log(saved.getUsername(), "PROFILE_UPDATED", "Updated own profile");
        return toResponse(saved);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = find(username);
        if (!encoder.matches(request.currentPassword(), user.getPassword())) {
            audit.log(user.getUsername(), "PASSWORD_CHANGE_FAILED", "Wrong current password");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (encoder.matches(request.newPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New password must be different from the current one");
        }
        user.setPassword(encoder.encode(request.newPassword()));
        repository.save(user);
        audit.log(user.getUsername(), "PASSWORD_CHANGED", "Changed own password");
    }

    private User find(String username) {
        return repository.findByUsernameIgnoreCase(username).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ProfileResponse toResponse(User u) {
        return new ProfileResponse(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(),
                u.getPhone(), u.getRole(), u.getCreatedAt());
    }
}
