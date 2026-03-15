package com.cafe.erp.pos.domain.model;

import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order extends BaseEntity {

    @Column(nullable = false, unique = true)
    private Long orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderSource source;

    private UUID tableId;
    private String tableName;

    private UUID deviceId;
    private String deviceName;

    @Column(nullable = false)
    private UUID cashierId;

    private String cashierName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.OPEN;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    private String discountType;     // MANUAL or PROMO

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;

    private UUID promoCodeId;
    private String promoCodeApplied;

    // Customer link (for loyalty)
    private UUID customerId;
    private String customerName;
    private Integer loyaltyPointsEarned;

    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderLine> lines = new ArrayList<>();

    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    public void recalculateTotals() {
        this.subtotal = lines.stream()
                .map(OrderLine::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.grandTotal = subtotal.subtract(discountAmount).add(taxAmount);
        if (this.grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            this.grandTotal = BigDecimal.ZERO;
        }
    }
}
