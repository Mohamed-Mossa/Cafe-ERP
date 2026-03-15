package com.cafe.erp.gaming.application.command;
import com.cafe.erp.gaming.domain.model.SessionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data public class SwitchTypeRequest { @NotNull private SessionType newType; }
