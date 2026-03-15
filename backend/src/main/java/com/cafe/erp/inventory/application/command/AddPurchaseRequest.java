package com.cafe.erp.inventory.application.command;
import jakarta.validation.constraints.*; import lombok.Data;
import java.math.BigDecimal; import java.time.LocalDate; import java.util.UUID;
@Data public class AddPurchaseRequest {
    @NotNull private UUID inventoryItemId;
    @NotNull @Positive private BigDecimal quantity;
    @NotNull @Positive private BigDecimal unitCost;
    private String supplierName; private String invoiceNumber;
    private LocalDate purchaseDate;
}
