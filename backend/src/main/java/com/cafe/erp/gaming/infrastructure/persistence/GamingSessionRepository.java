package com.cafe.erp.gaming.infrastructure.persistence;
import com.cafe.erp.gaming.domain.model.GamingSession;
import com.cafe.erp.gaming.domain.model.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface GamingSessionRepository extends JpaRepository<GamingSession, UUID> {
    Optional<GamingSession> findByDeviceIdAndStatus(UUID deviceId, SessionStatus status);
    List<GamingSession> findByStatus(SessionStatus status);
    List<GamingSession> findByStartedAtBetween(LocalDateTime start, LocalDateTime end);
}
