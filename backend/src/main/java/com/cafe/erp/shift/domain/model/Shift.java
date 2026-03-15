package com.cafe.erp.shift.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "shifts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Shift extends BaseEntity {
    @Column(nullable = false) private UUID cashierId;
    @Column(nullable = false, length = 100) private String cashierName;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal openingBalance;
    @Column(precision = 10, scale = 2) private BigDecimal expectedCash;
    @Column(precision = 10, scale = 2) private BigDecimal actualCash;
    @Column(precision = 10, scale = 2) private BigDecimal cashVariance;
    @Column(precision = 10, scale = 2) @Builder.Default private BigDecimal totalSales = BigDecimal.ZERO;
    @Column(precision = 10, scale = 2) @Builder.Default private BigDecimal totalExpenses = BigDecimal.ZERO;
    @Column(precision = 10, scale = 2) @Builder.Default private BigDecimal netCash = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) @Builder.Default
    private ShiftStatus status = ShiftStatus.OPEN;
    private LocalDateTime closedAt;
    private String closingNotes;
}
