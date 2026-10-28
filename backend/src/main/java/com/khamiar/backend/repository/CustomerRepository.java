package com.khamiar.backend.repository;

import com.khamiar.backend.entity.Customer;
import com.khamiar.backend.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findAllByOrderByIdDesc();

    List<Customer> findByCustomerNameContainingIgnoreCaseOrPhoneContainingOrderByIdDesc(
            String name, String phone);

    // Ripoti
    List<Customer> findByTravelDateBetweenOrderByTravelDateAscIdAsc(LocalDate from, LocalDate to);

    List<Customer> findByTravelDateBetweenAndCreatedByOrderByTravelDateAscIdAsc(
            LocalDate from, LocalDate to, String createdBy);

    List<Customer> findByCreatedByOrderByIdDesc(String createdBy);

    // Orodha ya abiria kwa kila route
    List<Customer> findByRouteIdOrderByTravelDateAscIdAsc(Long routeId);

    List<Customer> findByRouteIdAndTravelDateOrderByIdAsc(Long routeId, LocalDate travelDate);

    // Tiketi
    @Query("select sum(c.ticketCount) from Customer c where c.routeId = :routeId and c.ticketStatus in :statuses")
    Long sumTickets(@Param("routeId") Long routeId, @Param("statuses") Collection<TicketStatus> statuses);

    boolean existsByPhoneAndRouteIdAndTravelDateAndTicketStatusNotAndIdNot(
            String phone, Long routeId, LocalDate travelDate, TicketStatus status, Long id);

    // Dashboard (tiketi zilizofutwa hazihesabiwi)
    @Query("select count(c) from Customer c where c.travelDate = :date "
            + "and (c.ticketStatus is null or c.ticketStatus <> com.khamiar.backend.entity.TicketStatus.CANCELLED)")
    long countByTravelDate(@Param("date") LocalDate date);

    @Query("select count(c) from Customer c where c.travelDate between :from and :to "
            + "and (c.ticketStatus is null or c.ticketStatus <> com.khamiar.backend.entity.TicketStatus.CANCELLED)")
    long countByTravelDateBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select sum(c.profit) from Customer c "
            + "where c.ticketStatus is null or c.ticketStatus <> com.khamiar.backend.entity.TicketStatus.CANCELLED")
    BigDecimal sumProfit();

    @Query("select sum(c.customerAmount) from Customer c "
            + "where c.ticketStatus is null or c.ticketStatus <> com.khamiar.backend.entity.TicketStatus.CANCELLED")
    BigDecimal sumCustomerAmount();

    @Query("select sum(c.systemAmount) from Customer c "
            + "where c.ticketStatus is null or c.ticketStatus <> com.khamiar.backend.entity.TicketStatus.CANCELLED")
    BigDecimal sumSystemAmount();

    @Query("select sum(c.profit) from Customer c where c.travelDate between :from and :to "
            + "and (c.ticketStatus is null or c.ticketStatus <> com.khamiar.backend.entity.TicketStatus.CANCELLED)")
    BigDecimal sumProfitBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
