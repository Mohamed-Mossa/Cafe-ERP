package com.cafe.erp.menu.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "price_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal oldPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal newPrice;

    private String changedBy;
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @PrePersist
    void prePersist() { this.changedAt = LocalDateTime.now(); }
}
