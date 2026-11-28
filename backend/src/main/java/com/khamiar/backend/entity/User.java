package com.khamiar.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;   // hapa inahifadhiwa HASH, si password halisi

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "token_version", nullable = false)
    private long tokenVersion = 0L;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 100)
    private String fullName;

    @Column(length = 150, unique = true)
    private String email;

    @Column(length = 30)
    private String phone;
    @Column(nullable=false, columnDefinition="boolean default false")
    private boolean emailVerified = false;
    @Version @Column(nullable=false, columnDefinition="bigint default 0") private long rowVersion;
    @Column(length=64, unique=true) private String verificationHash;
    private java.time.Instant verificationExpires;
    @Column(length=64, unique=true) private String resetHash;
    private java.time.Instant resetExpires;
    public boolean isEmailVerified(){ return emailVerified; }
    public void setEmailVerified(boolean value){ emailVerified=value; }
    public String getVerificationHash(){return verificationHash;}
    public java.time.Instant getVerificationExpires(){return verificationExpires;}
    public void verification(String hash, java.time.Instant expires){verificationHash=hash;verificationExpires=expires;}
    public String getResetHash(){return resetHash;}
    public java.time.Instant getResetExpires(){return resetExpires;}
    public void reset(String hash, java.time.Instant expires){resetHash=hash;resetExpires=expires;}


    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public long getTokenVersion() {
        return tokenVersion;
    }

    public void revokeSessions() {
        this.tokenVersion++;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; reset(null,null); verification(null,null); }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) {
        if (!java.util.Objects.equals(this.email,email)) {
            emailVerified=false; verification(null,null); reset(null,null);
        }
        this.email = email;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
