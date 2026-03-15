package com.cafe.erp.identity.domain.model;

public enum UserRole {
    OWNER,      // 0 - highest
    MANAGER,    // 1
    SUPERVISOR, // 2
    CASHIER,    // 3
    WAITER;     // 4 - lowest

    public boolean isAtLeast(UserRole required) {
        return this.ordinal() <= required.ordinal();
    }

    public double getMaxDiscountPercent() {
        return switch (this) {
            case OWNER, MANAGER -> 100.0;
            case SUPERVISOR -> 15.0;
            case CASHIER -> 5.0;
            case WAITER -> 0.0;
        };
    }
}
