package com.cafe.erp.inventory.application.command;
import jakarta.validation.constraints.*; import lombok.Data;
import java.math.BigDecimal; import java.util.UUID;
@Data public class StockCountRequest {
    @NotNull private UUID inventoryItemId;
    @NotNull @PositiveOrZero private BigDecimal actualCount;
    private String notes;
}
