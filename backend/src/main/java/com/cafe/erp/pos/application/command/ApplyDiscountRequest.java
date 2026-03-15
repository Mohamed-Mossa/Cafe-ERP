package com.cafe.erp.pos.application.command;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ApplyDiscountRequest {
    @NotNull private BigDecimal discountPercent;  // 0-100
}
