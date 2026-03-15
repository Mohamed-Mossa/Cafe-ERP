package com.cafe.erp.identity.application.query;

import com.cafe.erp.identity.domain.model.Role;
import com.cafe.erp.identity.domain.model.User;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String fullName,
        Role role,
        boolean active,
        int maxDiscountPercent
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getUsername(), user.getFullName(),
                user.getRole(), user.isActive(), user.getMaxDiscountPercent()
        );
    }
}
