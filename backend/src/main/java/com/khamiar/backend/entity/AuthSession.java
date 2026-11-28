package com.khamiar.backend.entity;
import jakarta.persistence.*;
import java.time.Instant;
@Entity @Table(name="auth_sessions")
public class AuthSession {
 @Id @Column(length=64) public String hash;
 @Column(nullable=false) public Long userId;
 @Column(nullable=false) public long tokenVersion;
 @Column(nullable=false) public Instant expires;
 @Column(nullable=false) public boolean remember;
}
