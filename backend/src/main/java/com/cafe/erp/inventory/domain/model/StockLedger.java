package com.cafe.erp.inventory.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDateTime; import java.util.UUID;

@Entity @Table(name = "stock_ledger")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockLedger {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false) private UUID inventoryItemId;
    @Column(nullable = false, precision = 10, scale = 4) private BigDecimal quantity; // positive=in, negative=out
    @Column(nullable = false, length = 20) private String transactionType; // PURCHASE, DEDUCTION, WASTAGE, ADJUSTMENT, COUNT
    private UUID referenceId;  // orderId, purchaseId, etc.
    @Column(length = 200) private String notes;
    @Column(nullable = false, precision = 10, scale = 4) private BigDecimal balanceAfter;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt;
    private String createdBy;
    @PrePersist void prePersist() { createdAt = LocalDateTime.now(); }
}
