package com.cafe.erp.pos.domain.model;

import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_lines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderLine extends BaseEntity {

    @Column(nullable = false)
    private UUID orderId;

    @Column(nullable = true)
    private UUID productId;

    @Column(nullable = false, length = 150)
    private String productName;   // Denormalized — snapshot at time of order

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;  // Snapshot at time of order

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(length = 300)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private KitchenStatus kitchenStatus = KitchenStatus.NEW;

    public void recalculate() {
        this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
