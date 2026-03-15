package com.cafe.erp.membership.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "customer_packages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerPackage extends BaseEntity {
    @Column(nullable = false) private UUID customerId;
    @Column(nullable = false) private UUID packageId;
    @Column(length = 100) private String packageName;
    @Column(nullable = false, precision = 6, scale = 2) private BigDecimal hoursRemaining;
    @Column(nullable = false, precision = 6, scale = 2) private BigDecimal hoursPurchased;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal purchasePrice;
    @Column(nullable = false) private LocalDate expiresAt;
    @Column(nullable = false) @Builder.Default private boolean active = true;
    private UUID cashierId;
    @Column(length = 10) private String deviceType;
    @Column(length = 10) private String sessionType;
}
