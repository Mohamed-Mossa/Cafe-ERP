package com.cafe.erp.menu.infrastructure.persistence;
import com.cafe.erp.menu.domain.model.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, UUID> {
    List<PriceHistory> findByProductIdOrderByChangedAtDesc(UUID productId);
}
