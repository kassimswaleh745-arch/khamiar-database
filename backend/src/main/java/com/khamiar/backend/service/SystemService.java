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

    @Transactional
    public boolean setLocked(boolean locked) {
        SystemSetting setting = repository.findById(SETTINGS_ID).orElseGet(() -> {
            SystemSetting s = new SystemSetting();
            s.setId(SETTINGS_ID);
            return s;
        });
        setting.setSystemLocked(locked);
        repository.save(setting);
        return locked;
    }
}
