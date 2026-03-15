package com.cafe.erp.inventory.infrastructure.persistence;
import com.cafe.erp.inventory.domain.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {
    List<Purchase> findByInventoryItemIdOrderByCreatedAtDesc(UUID itemId);
    List<Purchase> findTop50ByDeletedFalseOrderByCreatedAtDesc();
}
