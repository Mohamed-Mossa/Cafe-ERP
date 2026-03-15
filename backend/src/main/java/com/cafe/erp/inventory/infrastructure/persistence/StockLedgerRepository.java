package com.cafe.erp.inventory.infrastructure.persistence;
import com.cafe.erp.inventory.domain.model.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal; import java.util.*; import java.util.UUID;
public interface StockLedgerRepository extends JpaRepository<StockLedger, UUID> {
    List<StockLedger> findByInventoryItemIdOrderByCreatedAtDesc(UUID itemId);
    @Query("SELECT COALESCE(SUM(l.quantity), 0) FROM StockLedger l WHERE l.inventoryItemId = :itemId")
    BigDecimal getCurrentStock(UUID itemId);
}
