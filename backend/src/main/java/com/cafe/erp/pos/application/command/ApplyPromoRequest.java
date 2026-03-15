package com.cafe.erp.pos.application.command;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApplyPromoRequest {
    @NotBlank private String promoCode;
}
