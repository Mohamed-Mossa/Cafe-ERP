package com.cafe.erp.membership.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "membership_packages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MembershipPackage extends BaseEntity {
    @Column(nullable = false, length = 100) private String name;
    @Column(length = 300) private String description;
    @Column(nullable = false, length = 10) @Builder.Default private String deviceType = "ANY";
    @Column(nullable = false, length = 10) @Builder.Default private String sessionType = "ANY";
    @Column(nullable = false, precision = 6, scale = 2) private BigDecimal hoursIncluded;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal price;
    @Column(nullable = false) @Builder.Default private int validityDays = 90;
    @Column(nullable = false) @Builder.Default private boolean active = true;
}
