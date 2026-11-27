package com.khamiar.backend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String allowedOrigin;

    // Password hashing
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // API Security and Role-Based Access Control
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(Customizer.withDefaults())

            .csrf(csrf -> csrf.disable())

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth

                // Public endpoints
                .requestMatchers(HttpMethod.OPTIONS, "/**")
                .permitAll()

                .requestMatchers("/api/auth/login")
                .permitAll()

                // Reports - Admin only
                .requestMatchers(
                    "/api/reports",
                    "/api/reports/**"
                )
                .hasRole("ADMIN")

                // System control - Admin only
                .requestMatchers("/api/system/**")
                .hasRole("ADMIN")

                // Travel routes - View only for Employee
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/routes",
                    "/api/routes/**"
                )
                .hasAnyRole("ADMIN", "EMPLOYEE")

                // Travel route management - Admin only
                .requestMatchers(
                    "/api/routes",
                    "/api/routes/**"
                )
                .hasRole("ADMIN")

                // Staff management - Admin only
                .requestMatchers("/api/staff/**")
                .hasRole("ADMIN")

                // Audit logs - Admin only
                .requestMatchers("/api/audit/**")
                .hasRole("ADMIN")

                // User management - Admin only
                .requestMatchers("/api/users/**")
                .hasRole("ADMIN")

                // Customer deletion - Admin only
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/customers/**"
                )
                .hasRole("ADMIN")

                // Other endpoints require authentication
                .anyRequest()
                .authenticated()
            )

            // JWT authentication
            .oauth2ResourceServer(oauth ->
                oauth.jwt(jwt ->
                    jwt.jwtAuthenticationConverter(
                        jwtAuthenticationConverter()
                    )
                )
            );

        return http.build();
    }

    // CORS Configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
            allowedOrigin,
            "https://khamiardatabase.netlify.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174"
        ));

        config.setAllowedMethods(List.of(
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type"
        ));

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/api/**", config);

        return source;
    }

    // Convert JWT roles into Spring Security authorities
    private JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter authorities =
            new JwtGrantedAuthoritiesConverter();

        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter =
            new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(authorities);

        return converter;
    }
}
