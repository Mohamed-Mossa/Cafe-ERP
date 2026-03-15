package com.cafe.erp.pos.application.command;
import com.cafe.erp.pos.domain.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ProcessPaymentRequest {
    @NotNull private List<PaymentEntry> payments;

    @Data
    public static class PaymentEntry {
        @NotNull private PaymentMethod method;
        @NotNull private BigDecimal amount;
        private String reference;
    }
}
