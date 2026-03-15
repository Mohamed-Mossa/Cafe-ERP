package com.cafe.erp.inventory.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal; import java.time.LocalDate; import java.util.UUID;

@Entity @Table(name = "inventory_purchases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Purchase extends BaseEntity {
    @Column(nullable = false) private UUID inventoryItemId;
    @Column(nullable = false, length = 100) private String itemName;
    @Column(nullable = false, precision = 10, scale = 4) private BigDecimal quantity;
    @Column(nullable = false, length = 20) private String unit;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal unitCost;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal totalCost;
    private String supplierName;
    private String invoiceNumber;
    private LocalDate purchaseDate;
}
