package com.cafe.erp.promotion.application.command;
import com.cafe.erp.promotion.domain.model.DiscountType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal; import java.time.LocalDate;

@Data public class CreatePromoRequest {
    @NotBlank @Size(min = 3, max = 30) private String code;
    @NotBlank private String description;
    @NotNull private DiscountType discountType;
    @NotNull @Positive private BigDecimal discountValue;
    @NotNull @Min(1) private int maxUsageCount;
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
    private BigDecimal minimumOrderAmount;
}
