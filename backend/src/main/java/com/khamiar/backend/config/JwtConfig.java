package com.khamiar.backend.config;

import com.khamiar.backend.entity.Role;
import com.khamiar.backend.entity.User;
import com.khamiar.backend.repository.UserRepository;
import com.khamiar.backend.service.SystemService;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
public class JwtConfig {

    @Value("${app.jwt.secret}")
    private String secret;

    private SecretKey key() {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret is too short (at least 32 characters)");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    /** Inatengeneza token wakati wa login */
    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key()));
    }

    /**
     * Inakagua saini na muda wa token, PAMOJA NA hali ya sasa kwenye database:
     * mtumiaji amezimwa, role imebadilika, au mfumo umefungwa (na si admin) => token inakataliwa.
     */
    @Bean
    public JwtDecoder jwtDecoder(UserRepository users, SystemService system) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key())
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

        OAuth2TokenValidator<Jwt> userStillValid = jwt -> {
            List<String> roles = jwt.getClaimAsStringList("roles");
            boolean ok = users.findByUsernameIgnoreCase(jwt.getSubject())
                    .filter(User::isActive)
                    .filter(u -> roles != null && roles.contains(u.getRole().name()))
                    .filter(u -> u.getRole() == Role.ADMIN || !system.isLocked())
                    .isPresent();
            return ok
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error(
                            "invalid_token",
                            "User is disabled, permissions changed, or the system is locked", null));
        };

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(), userStillValid));
        return decoder;
    }
}
