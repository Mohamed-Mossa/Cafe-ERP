package com.cafe.erp.crm.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "customers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer extends BaseEntity {
    @Column(nullable = false, unique = true, length = 20) private String phone;
    @Column(nullable = false, length = 100) private String fullName;
    @Column(length = 150) private String email;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) @Builder.Default
    private CustomerTier tier = CustomerTier.BRONZE;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default private BigDecimal creditBalance = BigDecimal.ZERO;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default private BigDecimal creditLimit = BigDecimal.ZERO;
    @Column(nullable = false) @Builder.Default private int totalPoints = 0;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default private BigDecimal totalSpent = BigDecimal.ZERO;
    private boolean active = true;
}
