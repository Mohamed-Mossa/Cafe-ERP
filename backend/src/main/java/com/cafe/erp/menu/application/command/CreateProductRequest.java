package com.cafe.erp.menu.application.command;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateProductRequest {
    @NotBlank private String sku;
    @NotBlank private String name;
    @NotNull @Positive private BigDecimal sellingPrice;
    @NotNull private UUID categoryId;
    private String imageUrl;
    private boolean availableInMatchMode;
    private int displayOrder;
}
