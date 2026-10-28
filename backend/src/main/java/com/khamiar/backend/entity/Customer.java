package com.khamiar.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(nullable = false)
    private LocalDate travelDate;

    @Column(nullable = false, length = 255)
    private String route;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal systemAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal customerAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal profit;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(length = 100)
    private String createdBy;

    @Column(length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentMethod paymentMethod;

    private Long routeId;

    private Integer ticketCount;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TicketStatus ticketStatus;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public LocalDate getTravelDate() { return travelDate; }
    public void setTravelDate(LocalDate travelDate) { this.travelDate = travelDate; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public BigDecimal getSystemAmount() { return systemAmount; }
    public void setSystemAmount(BigDecimal systemAmount) { this.systemAmount = systemAmount; }

    public BigDecimal getCustomerAmount() { return customerAmount; }
    public void setCustomerAmount(BigDecimal customerAmount) { this.customerAmount = customerAmount; }

    public BigDecimal getProfit() { return profit; }
    public void setProfit(BigDecimal profit) { this.profit = profit; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public Long getRouteId() { return routeId; }
    public void setRouteId(Long routeId) { this.routeId = routeId; }

    public Integer getTicketCount() { return ticketCount; }
    public void setTicketCount(Integer ticketCount) { this.ticketCount = ticketCount; }

    public TicketStatus getTicketStatus() { return ticketStatus; }
    public void setTicketStatus(TicketStatus ticketStatus) { this.ticketStatus = ticketStatus; }
}
