package com.khamiar.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    private Long id;

    @Column(nullable = false)
    private boolean systemLocked;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isSystemLocked() { return systemLocked; }
    public void setSystemLocked(boolean systemLocked) { this.systemLocked = systemLocked; }
}
