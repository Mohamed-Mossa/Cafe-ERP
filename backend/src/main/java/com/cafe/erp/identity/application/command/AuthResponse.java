package com.cafe.erp.identity.application.command;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String username;
    private String fullName;
    private String role;
    private int maxDiscountPercent;
}
