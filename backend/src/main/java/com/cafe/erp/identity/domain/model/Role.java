package com.cafe.erp.identity.domain.model;

public enum Role {
    OWNER,
    MANAGER,
    SUPERVISOR,
    CASHIER,
    WAITER,
    KITCHEN,   // Kitchen staff: KDS + order history only
    BARISTA    // Barista: KDS + order history only (drinks focus)
}
