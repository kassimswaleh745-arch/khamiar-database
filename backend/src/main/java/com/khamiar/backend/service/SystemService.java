package com.khamiar.backend.service;

import com.khamiar.backend.entity.SystemSetting;
import com.khamiar.backend.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SystemService {

    private static final Long SETTINGS_ID = 1L;

    private final SystemSettingRepository repository;

    public SystemService(SystemSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public boolean isLocked() {
        return repository.findById(SETTINGS_ID)
                .map(SystemSetting::isSystemLocked)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> maintenanceStatus() {
        SystemSetting setting = repository.findById(SETTINGS_ID)
                .orElseGet(SystemSetting::new);

        boolean locked = setting.isSystemLocked();

        return java.util.Map.of(
                "locked", locked,
                "reopeningStatus",
                !locked ? "NOT_REQUIRED"
                    : setting.getReopeningRequestedAt() != null
                        ? "PENDING" : "NOT_REQUESTED"
        );
    }

    @Transactional
    public boolean requestReopening(String username) {
        SystemSetting setting = repository.findById(SETTINGS_ID)
                .orElseThrow(() ->
                    new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.CONFLICT,
                        "Maintenance is not active"));

        if (!setting.isSystemLocked()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Maintenance is not active");
        }

        if (setting.getReopeningRequestedAt() != null) {
            return false;
        }

        setting.setReopeningRequestedBy(username);
        setting.setReopeningRequestedAt(java.time.Instant.now());
        repository.save(setting);

        return true;
    }

    @Transactional
    public boolean setLocked(boolean locked) {
        SystemSetting setting = repository.findById(SETTINGS_ID).orElseGet(() -> {
            SystemSetting s = new SystemSetting();
            s.setId(SETTINGS_ID);
            return s;
        });
        if (setting.isSystemLocked() != locked) {
            setting.setReopeningRequestedBy(null);
            setting.setReopeningRequestedAt(null);
        }

        setting.setSystemLocked(locked);
        repository.save(setting);
        return locked;
    }
}
