package com.cafe.erp.menu.application.command;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdatePriceRequest {
    @NotNull @Positive private BigDecimal newPrice;
    private String reason;
}
