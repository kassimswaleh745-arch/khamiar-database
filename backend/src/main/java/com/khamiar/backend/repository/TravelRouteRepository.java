package com.khamiar.backend.repository;

import com.khamiar.backend.entity.TravelRoute;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TravelRouteRepository extends JpaRepository<TravelRoute, Long> {

    List<TravelRoute> findAllByOrderByNameAsc();

    Optional<TravelRoute> findByNameIgnoreCase(String name);

    /** Inafunga safu ya route wakati wa kutoa tiketi, ili staff wawili wasiuze tiketi ya mwisho pamoja */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from TravelRoute r where r.id = :id")
    Optional<TravelRoute> findForUpdate(@Param("id") Long id);
}
