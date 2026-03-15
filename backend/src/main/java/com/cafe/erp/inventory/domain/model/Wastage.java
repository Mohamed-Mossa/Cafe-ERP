package com.cafe.erp.inventory.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal; import java.util.UUID;

@Entity @Table(name = "inventory_wastage")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Wastage extends BaseEntity {
    @Column(nullable = false) private UUID inventoryItemId;
    @Column(nullable = false, length = 100) private String itemName;
    @Column(nullable = false, precision = 10, scale = 4) private BigDecimal quantity;
    @Column(nullable = false, length = 20) private String unit;
    @Column(length = 200) private String reason;
    private String reportedBy;
}
