package com.cafe.erp.gaming.application.command;
import com.cafe.erp.gaming.domain.model.SessionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;
@Data public class StartSessionRequest {
    @NotNull private UUID deviceId;
    @NotNull private SessionType sessionType;
    private UUID customerId;
}
