package com.cafe.erp.gaming.application;

import com.cafe.erp.gaming.domain.model.GamingSession;

import java.math.BigDecimal;
import java.util.UUID;

public record EndSessionResult(
        GamingSession session,
        UUID linkedOrderId,
        boolean packageUsed,
        UUID customerPackageId,
        BigDecimal deductedHours
) {
}
