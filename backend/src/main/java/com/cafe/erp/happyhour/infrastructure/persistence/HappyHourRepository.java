package com.cafe.erp.happyhour.infrastructure.persistence;
import com.cafe.erp.happyhour.domain.model.HappyHour;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface HappyHourRepository extends JpaRepository<HappyHour, UUID> {
    List<HappyHour> findByDeletedFalseOrderByStartTime();
    List<HappyHour> findByActiveAndDeletedFalse(boolean active);
}
