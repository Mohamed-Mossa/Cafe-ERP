package com.cafe.erp.inventory.domain.model;

import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "inventory_items")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String sku;

    private String category;

    @Column(nullable = false)
    private String unit;

    @Column(name = "current_stock", nullable = false)
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "reorder_level", nullable = false)
    @Builder.Default
    private BigDecimal reorderLevel = BigDecimal.ZERO;

    @Column(name = "safety_stock", nullable = false)
    @Builder.Default
    private BigDecimal safetyStock = BigDecimal.ZERO;

    @Column(name = "average_cost", nullable = false, precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal averageCost = BigDecimal.ZERO;

    @Column(name = "average_daily_usage")
    @Builder.Default
    private BigDecimal averageDailyUsage = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    public StockStatus getStockStatus() {
        if (currentStock.compareTo(BigDecimal.ZERO) <= 0) return StockStatus.OUT;
        if (currentStock.compareTo(safetyStock) <= 0) return StockStatus.CRITICAL;
        if (currentStock.compareTo(reorderLevel) <= 0) return StockStatus.LOW;
        return StockStatus.OK;
    }

    public void deduct(BigDecimal qty) {
        this.currentStock = this.currentStock.subtract(qty);
    }

    public void add(BigDecimal qty) {
        this.currentStock = this.currentStock.add(qty);
    }

    public enum StockStatus { OK, LOW, CRITICAL, OUT }
}
