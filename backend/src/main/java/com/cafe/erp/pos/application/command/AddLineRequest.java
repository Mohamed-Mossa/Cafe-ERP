package com.cafe.erp.pos.application.command;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

@Data
public class AddLineRequest {
    @NotNull private UUID productId;
    @Min(1) private int quantity = 1;
    private String notes;
}
