package com.cafe.erp.inventory.application.command;
import jakarta.validation.constraints.*; import lombok.Data;
import java.math.BigDecimal; import java.util.UUID;
@Data public class RecordWastageRequest {
    @NotNull private UUID inventoryItemId;
    @NotNull @Positive private BigDecimal quantity;
    private String reason;
}
