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

    List<Customer> findByCustomerNameContainingIgnoreCaseOrPhoneContainingOrBookingReferenceContainingIgnoreCaseOrderByIdDesc(
            String name, String phone, String bookingReference);

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

    List<Customer> findByPhoneOrderByIdDesc(String phone);


    @Query(value = """
        SELECT * FROM customers
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
        """, nativeQuery = true)
    List<Customer> findDeletedCustomers();

    @Query(value = """
        SELECT * FROM customers
        WHERE id = :id AND deleted_at IS NOT NULL
        FOR UPDATE
        """, nativeQuery = true)
    java.util.Optional<Customer> findDeletedById(
            @Param("id") Long id);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = """
        UPDATE customers
        SET deleted_at = NULL, deleted_by = NULL
        WHERE id = :id AND deleted_at IS NOT NULL
        """, nativeQuery = true)
    int restoreDeletedCustomer(@Param("id") Long id);

}
