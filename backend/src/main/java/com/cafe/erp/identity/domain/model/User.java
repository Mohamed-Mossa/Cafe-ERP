package com.cafe.erp.identity.domain.model;

import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    @Builder.Default private boolean active = true;

    @Column(nullable = false)
    private int maxDiscountPercent;  // 5=CASHIER, 15=SUPERVISOR, 100=MANAGER+

    private LocalDateTime lastLoginAt;

    private String pin;   // 4-digit PIN for mid-session escalation

    public int getMaxDiscountByRole() {
        return switch (role) {
            case CASHIER -> 5;
            case SUPERVISOR -> 15;
            default -> 100;
        };
    }
}
