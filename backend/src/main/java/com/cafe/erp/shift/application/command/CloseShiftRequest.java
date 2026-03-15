package com.cafe.erp.shift.application.command;
import jakarta.validation.constraints.NotNull; import lombok.Data; import java.math.BigDecimal;
@Data public class CloseShiftRequest { @NotNull private BigDecimal actualCash; private String closingNotes; }
