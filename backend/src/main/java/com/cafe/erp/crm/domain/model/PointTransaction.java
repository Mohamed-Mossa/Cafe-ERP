package com.cafe.erp.crm.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "point_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PointTransaction extends BaseEntity {
    @Column(nullable = false) private UUID customerId;
    @Column(nullable = false) private int points;  // positive = earn, negative = redeem
    @Column(nullable = false, length = 20) private String type; // EARN, REDEEM, EXPIRE
    @Column(length = 200) private String description;
    private UUID orderId;
    private BigDecimal orderAmount;
    @Column(nullable = false) private int balanceAfter;
}
