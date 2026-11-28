package com.khamiar.backend.service;

import com.khamiar.backend.dto.AuditLogResponse;
import com.khamiar.backend.entity.AuditLog;
import com.khamiar.backend.repository.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.khamiar.backend.dto.AuditPageResponse;

@Service
public class AuditService {

    private final AuditLogRepository repository;
    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void log(String actor, String action, String details, String ip) {
        AuditLog entry = new AuditLog();
        entry.setActor(cut(actor, 150));
        entry.setAction(action);
        entry.setDetails(cut(details, 500));
        entry.setIp(cut(ip, 64));
        repository.save(entry);
    }

    public void log(String actor, String action, String details) {
        log(actor, action, details, null);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> recent(int limit) {
        int size = Math.max(1, Math.min(limit, 100));
        return repository.findAllByOrderByIdDesc(PageRequest.of(0, size)).stream()
                .map(a -> new AuditLogResponse(
                        a.getId(), a.getCreatedAt(), a.getActor(), a.getAction(), a.getDetails(), a.getIp()))
                .toList();
    }


    @Transactional(readOnly = true)
    public AuditPageResponse search(
            String search,
            String action,
            LocalDate from,
            LocalDate to,
            int page,
            int size) {

        if (from != null && to != null && from.isAfter(to)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid date range");
        }

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));

        Specification<AuditLog> spec =
            (root, query, cb) -> cb.conjunction();

        if (search != null && !search.isBlank()) {
            String term = "%" +
                search.trim().toLowerCase(Locale.ROOT) + "%";

            spec = spec.and((root, query, cb) ->
                cb.or(
                    cb.like(cb.lower(root.get("actor")), term),
                    cb.like(cb.lower(root.get("action")), term),
                    cb.like(cb.lower(root.get("details")), term)
                )
            );
        }

        if (action != null && !action.isBlank()) {
            spec = spec.and((root, query, cb) ->
                cb.equal(root.get("action"), action.trim()));
        }

        if (from != null) {
            spec = spec.and((root, query, cb) ->
                cb.greaterThanOrEqualTo(
                    root.<LocalDateTime>get("createdAt"),
                    from.atStartOfDay()));
        }

        if (to != null) {
            spec = spec.and((root, query, cb) ->
                cb.lessThan(
                    root.<LocalDateTime>get("createdAt"),
                    to.plusDays(1).atStartOfDay()));
        }

        var result = repository.findAll(
            spec,
            PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "id")
            )
        );

        var rows = result.getContent().stream()
            .map(a -> new AuditLogResponse(
                a.getId(),
                a.getCreatedAt(),
                a.getActor(),
                a.getAction(),
                a.getDetails(),
                a.getIp()
            ))
            .toList();

        LocalDateTime today =
            LocalDate.now().atStartOfDay();

        long todayActivities = repository.count(
            (root, query, cb) -> cb.and(
                cb.greaterThanOrEqualTo(
                    root.<LocalDateTime>get("createdAt"), today),
                cb.lessThan(
                    root.<LocalDateTime>get("createdAt"),
                    today.plusDays(1))
            )
        );

        long securityEvents = repository.count(
            (root, query, cb) ->
                root.get("action").in(
                    "LOGIN_FAILED",
                    "LOGIN_BLOCKED",
                    "LOGIN_REFUSED",
                    "PASSWORD_CHANGE_FAILED",
                    "PASSWORD_RESET",
                    "PASSWORD_CHANGED"
                )
        );

        return new AuditPageResponse(
            rows,
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages(),
            repository.count(),
            todayActivities,
            securityEvents
        );
    }

    private static String cut(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
