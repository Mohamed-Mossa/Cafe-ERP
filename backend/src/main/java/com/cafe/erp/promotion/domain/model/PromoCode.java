package com.cafe.erp.promotion.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "promo_codes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PromoCode extends BaseEntity {
    @Column(nullable = false, unique = true, length = 30) private String code;
    @Column(nullable = false, length = 200) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private DiscountType discountType;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal discountValue;
    @Column(nullable = false) private int maxUsageCount;
    @Column(nullable = false) @Builder.Default private int currentUsageCount = 0;
    @Column(nullable = false) private LocalDate startDate;
    @Column(nullable = false) private LocalDate endDate;
    @Column(nullable = false) @Builder.Default private boolean active = true;
    @Column(nullable = false) private UUID createdByOwnerId;
    @Version private Long version; // Optimistic locking prevents concurrent over-use
    private BigDecimal minimumOrderAmount;
}
