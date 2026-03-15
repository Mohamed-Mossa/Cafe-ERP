package com.cafe.erp.pos.application.command;
import com.cafe.erp.pos.domain.model.OrderSource;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CreateOrderRequest {
    @NotNull private OrderSource source;
    private UUID tableId;
    private String tableName;
    private UUID deviceId;
    private String deviceName;
    private UUID customerId;
}
