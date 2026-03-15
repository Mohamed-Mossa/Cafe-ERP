package com.cafe.erp.settings.infrastructure.persistence;
import com.cafe.erp.settings.domain.model.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface SystemSettingRepository extends JpaRepository<SystemSetting, UUID> {
    Optional<SystemSetting> findBySettingKey(String key);
}
