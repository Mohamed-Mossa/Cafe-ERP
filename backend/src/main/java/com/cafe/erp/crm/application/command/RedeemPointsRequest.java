package com.cafe.erp.crm.application.command;
import jakarta.validation.constraints.*; import lombok.Data; import java.util.UUID;
@Data public class RedeemPointsRequest {
    @NotNull @Min(1) private int points;
    private UUID orderId;
}
