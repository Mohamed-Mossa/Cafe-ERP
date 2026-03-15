package com.cafe.erp.inventory.infrastructure.persistence;
import com.cafe.erp.inventory.domain.model.Wastage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*; import java.util.UUID;
public interface WastageRepository extends JpaRepository<Wastage, UUID> {
    List<Wastage> findByInventoryItemIdOrderByCreatedAtDesc(UUID itemId);
}
