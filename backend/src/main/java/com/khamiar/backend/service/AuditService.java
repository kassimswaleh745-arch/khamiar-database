package com.khamiar.backend.service;

import com.khamiar.backend.dto.AuditLogResponse;
import com.khamiar.backend.entity.AuditLog;
import com.khamiar.backend.repository.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    private static String cut(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
