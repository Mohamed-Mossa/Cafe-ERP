package com.cafe.erp.inventory.infrastructure.persistence;
import com.cafe.erp.inventory.domain.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List; import java.util.UUID;
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {
    List<InventoryItem> findByDeletedFalseOrderByName();
    @Query("SELECT i FROM InventoryItem i WHERE i.currentStock <= i.reorderLevel AND i.deleted = false")
    List<InventoryItem> findLowStockItems();
}
