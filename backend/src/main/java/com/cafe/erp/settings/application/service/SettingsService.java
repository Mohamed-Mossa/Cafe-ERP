package com.cafe.erp.settings.application.service;

import com.cafe.erp.settings.domain.model.SystemSetting;
import com.cafe.erp.settings.infrastructure.persistence.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class SettingsService {
    private final SystemSettingRepository repo;

    public Map<String, String> getAllSettings() {
        return repo.findAll().stream()
            .collect(Collectors.toMap(SystemSetting::getSettingKey, s -> s.getSettingValue() != null ? s.getSettingValue() : ""));
    }

    public String get(String key, String defaultValue) {
        return repo.findBySettingKey(key).map(SystemSetting::getSettingValue).orElse(defaultValue);
    }

    @Transactional
    public Map<String, String> updateSettings(Map<String, String> updates) {
        updates.forEach((key, value) -> {
            SystemSetting setting = repo.findBySettingKey(key).orElseGet(() ->
                SystemSetting.builder().settingKey(key).build());
            setting.setSettingValue(value);
            setting.setUpdatedAt(LocalDateTime.now());
            repo.save(setting);
        });
        return getAllSettings();
    }
}
