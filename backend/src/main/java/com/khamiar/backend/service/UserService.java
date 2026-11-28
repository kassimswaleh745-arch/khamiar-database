package com.khamiar.backend.service;

import com.khamiar.backend.dto.CreateDeveloperRequest;
import com.khamiar.backend.dto.CreateUserRequest;
import com.khamiar.backend.dto.ResetPasswordRequest;
import com.khamiar.backend.dto.UpdateUserRequest;
import com.khamiar.backend.dto.UpdateUserProfileRequest;
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
        if (request.role() == Role.DEVELOPER) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "This role cannot be assigned through staff management"
            );
        }

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
        if (request.role() == Role.DEVELOPER) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "This role cannot be assigned through staff management"
            );
        }

        User user = getOrThrow(id);

        boolean isSelf = user.getUsername().equalsIgnoreCase(currentUsername);
        if (isSelf && (request.role() != Role.ADMIN || !request.active())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "You cannot demote or disable your own account");
        }

        boolean accessChanged =
                user.getRole() != request.role()
                || user.isActive() != request.active();

        if (accessChanged) {
            user.revokeSessions();
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
        user.revokeSessions();
        repository.save(user);
        audit.log(actor, "PASSWORD_RESET", "Reset password for '" + user.getUsername() + "'");
    }


    @Transactional
    public UserResponse updateProfile(
            Long id,
            UpdateUserProfileRequest request,
            String actor) {

        User user = getOrThrow(id);

        String email = clean(request.email());

        if (email != null) {

            boolean emailTaken = repository
                    .findByEmailIgnoreCase(email)
                    .filter(existing -> !existing.getId().equals(id))
                    .isPresent();

            boolean usernameTaken = repository
                    .findByUsernameIgnoreCase(email)
                    .filter(existing -> !existing.getId().equals(id))
                    .isPresent();

            if (emailTaken || usernameTaken) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Email is already in use"
                );
            }
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(email);

        User saved = repository.save(user);

        audit.log(
                actor,
                "USER_PROFILE_UPDATED",
                "Updated profile for '" + saved.getUsername() + "'"
        );

        return toResponse(saved);
    }


    @Transactional(readOnly = true)
    public List<String> suggestUsernames(String fullName) {

        if (fullName == null || fullName.isBlank()
                || fullName.length() > 100) {
            return List.of();
        }

        String normalized = java.text.Normalizer.normalize(
                fullName,
                java.text.Normalizer.Form.NFD
        )
        .replaceAll("\\p{M}+", "")
        .toLowerCase(java.util.Locale.ROOT)
        .replaceAll("[^a-z0-9]+", ".")
        .replaceAll("^\\.+|\\.+$", "");

        if (normalized.length() < 3) {
            return List.of();
        }

        String[] parts = normalized.split("\\.");

        String first = parts[0];
        String last = parts[parts.length - 1];

        java.util.Set<String> candidates =
                new java.util.LinkedHashSet<>();

        candidates.add(normalized);

        if (parts.length >= 2) {
            candidates.add(first + "." + last);
            candidates.add(first + "." + parts[1]);
            candidates.add(first + last);
        }

        if (parts.length >= 3) {
            candidates.add(
                first + "." + parts[1].charAt(0) + "." + last
            );
        }

        String root = parts.length >= 2
                ? first + "." + last
                : first;

        root = root.substring(0, Math.min(root.length(), 45));

        for (int i = 1; i <= 30; i++) {
            candidates.add(
                root + String.format(
                    java.util.Locale.ROOT, "%02d", i
                )
            );
        }

        List<String> available = new java.util.ArrayList<>();

        for (String username : candidates) {

            if (!username.matches("[a-z0-9._-]{3,50}")) {
                continue;
            }

            boolean exists =
                    repository.findByUsernameIgnoreCase(username).isPresent()
                    || repository.findByEmailIgnoreCase(username).isPresent();

            if (!exists) {
                available.add(username);
            }

            if (available.size() == 5) {
                break;
            }
        }

        return available;
    }


    @Transactional
    public void revokeDeveloperAccess(Long id, String actor) {

        User user = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() != Role.DEVELOPER) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Account is not a developer account");
        }

        user.setActive(false);
        user.revokeSessions();

        repository.save(user);

        audit.log(
                actor,
                "DEVELOPER_ACCESS_REVOKED",
                "Revoked technical access for '" +
                user.getUsername() + "'");
    }


    @Transactional
    public UserResponse createDeveloper(
            CreateDeveloperRequest request,
            String actor) {

        String username = request.username().trim();

        if (repository.findByUsernameIgnoreCase(username).isPresent()
                || repository.findByEmailIgnoreCase(username).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Username already exists");
        }

        if (request.password().getBytes(
                java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password exceeds 72 UTF-8 bytes");
        }

        User user = new User();
        user.setUsername(username);
        user.setFullName(request.fullName().trim());
        user.setPassword(encoder.encode(request.password()));
        user.setRole(Role.DEVELOPER);
        user.setActive(true);

        User saved = repository.save(user);

        audit.log(
                actor,
                "DEVELOPER_ACCOUNT_CREATED",
                "Created technical account '" + username + "'");

        return toResponse(saved);
    }

    private User getOrThrow(Long id) {
        User user = repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole() == Role.DEVELOPER) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Technical accounts require authorized account management"
            );
        }

        return user;
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(),
                u.getRole(), u.isActive(), u.getCreatedAt());
    }
}
