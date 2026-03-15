package com.cafe.erp.identity.infrastructure.persistence;

import com.cafe.erp.identity.domain.model.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    Page<ActivityLog> findByUserIdOrderByPerformedAtDesc(UUID userId, Pageable pageable);
    Page<ActivityLog> findByActionOrderByPerformedAtDesc(String action, Pageable pageable);
}
