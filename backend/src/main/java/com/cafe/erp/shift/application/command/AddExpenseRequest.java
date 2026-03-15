package com.cafe.erp.shift.application.command;
import jakarta.validation.constraints.*; import lombok.Data; import java.math.BigDecimal;
@Data public class AddExpenseRequest {
    @NotBlank private String description;
    @NotNull @Positive private BigDecimal amount;
    private String category; private String receiptRef;
}
