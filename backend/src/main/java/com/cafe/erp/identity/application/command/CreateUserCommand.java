package com.cafe.erp.identity.application.command;

import com.cafe.erp.identity.domain.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserCommand(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50)
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 6)
        String password,

        @NotBlank(message = "Full name is required")
        String fullName,

        @NotNull(message = "Role is required")
        Role role
) {}
