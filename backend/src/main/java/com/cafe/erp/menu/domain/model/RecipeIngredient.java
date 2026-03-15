package com.cafe.erp.menu.domain.model;

import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "recipe_ingredients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecipeIngredient extends BaseEntity {

    @Column(nullable = false)
    private UUID recipeId;

    @Column(nullable = false)
    private UUID inventoryItemId;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit;  // g, ml, pcs, etc.
}
