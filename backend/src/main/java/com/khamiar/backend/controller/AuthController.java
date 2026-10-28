package com.khamiar.backend.controller;

import com.khamiar.backend.dto.LoginRequest;
import com.khamiar.backend.dto.LoginResponse;
import com.khamiar.backend.entity.Role;
import com.khamiar.backend.entity.User;
import com.khamiar.backend.repository.UserRepository;
import com.khamiar.backend.service.AuditService;
import com.khamiar.backend.service.LoginAttemptService;
import com.khamiar.backend.service.SystemService;
import com.khamiar.backend.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // Ujumbe mmoja wa jumla kwa kila kosa la login (SRS 6.4)
    private static final String GENERIC_ERROR = "Email, username, or password is incorrect";

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final TokenService tokens;
    private final SystemService system;
    private final LoginAttemptService attempts;
    private final AuditService audit;
    private final String dummyHash;

    public AuthController(UserRepository users, PasswordEncoder encoder, TokenService tokens,
                          SystemService system, LoginAttemptService attempts, AuditService audit) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
        this.system = system;
        this.attempts = attempts;
        this.audit = audit;
        this.dummyHash = encoder.encode("dummy-password-for-timing");
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        String identifier = request.username().trim();
        String ip = http.getRemoteAddr();

        long wait = attempts.secondsUntilAllowed(identifier, ip);
        if (wait > 0) {
            audit.log(identifier, "LOGIN_BLOCKED", "Too many failed attempts", ip);
            long minutes = Math.max(1, (wait + 59) / 60);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many failed attempts. Please try again in " + minutes
                            + (minutes == 1 ? " minute." : " minutes."));
        }

        Optional<User> found = users.findByUsernameIgnoreCase(identifier)
                .or(() -> users.findByEmailIgnoreCase(identifier));

        // Tunalinganisha password kila mara (hata jina lisipokuwepo), ili kasi ya jibu isifichue kitu
        String hash = found.map(User::getPassword).orElse(dummyHash);
        boolean passwordOk = encoder.matches(request.password(), hash);

        User user = found.filter(User::isActive).filter(u -> passwordOk).orElse(null);
        if (user == null) {
            attempts.recordFailure(identifier, ip);
            audit.log(identifier, "LOGIN_FAILED", "Incorrect credentials", ip);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, GENERIC_ERROR);
        }

        // Mfumo ukiwa umefungwa, ni admin pekee anayeingia
        if (user.getRole() != Role.ADMIN && system.isLocked()) {
            audit.log(user.getUsername(), "LOGIN_REFUSED", "System is locked", ip);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The system is currently locked by the administrator. Please try again later.");
        }

        attempts.recordSuccess(identifier);
        audit.log(user.getUsername(), "LOGIN_SUCCESS", null, ip);

        return new LoginResponse(
                tokens.generate(user),
                user.getUsername(),
                user.getRole().name(),
                tokens.getExpiryMinutes());
    }

    /** Inaonyesha nani ameingia */
    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        return Map.of(
                "username", auth.getName(),
                "roles", auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList());
    }
}
