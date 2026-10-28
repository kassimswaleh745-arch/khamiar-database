package com.khamiar.backend.config;

import com.khamiar.backend.entity.Role;
import com.khamiar.backend.entity.User;
import com.khamiar.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Value("${app.seed.employee-password:}")
    private String employeePassword;

    public DataSeeder(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) {
            return;
        }
        if (adminPassword.isBlank() || employeePassword.isBlank()) {
            log.warn("No users exist. Set app.seed.admin-password and app.seed.employee-password.");
            return;
        }
        create("admin", adminPassword, Role.ADMIN);
        create("employee", employeePassword, Role.EMPLOYEE);
        log.info("Initial users created: admin and employee");
    }

    private void create(String username, String rawPassword, Role role) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(encoder.encode(rawPassword));   // hash hapa
        u.setRole(role);
        users.save(u);
    }
}
