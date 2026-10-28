package com.khamiar.backend.repository;

import com.khamiar.backend.entity.TicketStockEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketStockRepository extends JpaRepository<TicketStockEntry, Long> {

    @Query("select sum(s.quantity) from TicketStockEntry s where s.routeId = :routeId")
    Long totalFor(@Param("routeId") Long routeId);
}
