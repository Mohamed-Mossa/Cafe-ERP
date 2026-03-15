package com.cafe.erp.identity.application.command;

import com.cafe.erp.identity.domain.model.UserRole;

import java.util.UUID;

public record LoginResponse(
    UUID userId,
    String username,
    String fullName,
    UserRole role,
    double maxDiscountPercent,
    String accessToken,
    String refreshToken,
    long accessTokenExpiresIn
) {}
