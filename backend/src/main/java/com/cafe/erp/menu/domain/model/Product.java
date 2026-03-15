package com.cafe.erp.menu.domain.model;

import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product extends BaseEntity {

    @Column(nullable = false, unique = true, length = 20)
    private String sku;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    private String imageUrl;
    @Builder.Default private boolean active = true;
    @Builder.Default private boolean availableInMatchMode = false;
    private int displayOrder;

    @Column(nullable = false)
    private UUID categoryId;

    // Computed field (not stored) — populated by service
    @Transient
    private BigDecimal costPrice;

    @Transient
    private BigDecimal profitMargin;

    @Transient
    private BigDecimal profitPercent;
}
