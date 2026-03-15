package com.cafe.erp.menu.domain.model;

import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "recipes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Recipe extends BaseEntity {

    @Column(nullable = false, unique = true)
    private UUID productId;

    private String notes;

    @OneToMany(mappedBy = "recipeId", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<RecipeIngredient> ingredients = new ArrayList<>();
}
