package com.cafe.erp.identity.application.command;

import jakarta.validation.constraints.NotBlank;

public record LoginCommand(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password
) {}
