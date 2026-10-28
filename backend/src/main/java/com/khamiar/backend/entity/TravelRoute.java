package com.khamiar.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "travel_routes")
public class TravelRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal customerPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal systemPrice;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getCustomerPrice() { return customerPrice; }
    public void setCustomerPrice(BigDecimal customerPrice) { this.customerPrice = customerPrice; }

    public BigDecimal getSystemPrice() { return systemPrice; }
    public void setSystemPrice(BigDecimal systemPrice) { this.systemPrice = systemPrice; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
