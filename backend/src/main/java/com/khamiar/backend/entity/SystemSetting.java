package com.khamiar.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    private Long id;

    @Column(nullable = false)
    private boolean systemLocked;

    @Column(length = 100)
    private String reopeningRequestedBy;

    private java.time.Instant reopeningRequestedAt;

    public String getReopeningRequestedBy() {
        return reopeningRequestedBy;
    }

    public void setReopeningRequestedBy(String value) {
        this.reopeningRequestedBy = value;
    }

    public java.time.Instant getReopeningRequestedAt() {
        return reopeningRequestedAt;
    }

    public void setReopeningRequestedAt(java.time.Instant value) {
        this.reopeningRequestedAt = value;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isSystemLocked() { return systemLocked; }
    public void setSystemLocked(boolean systemLocked) { this.systemLocked = systemLocked; }
}
