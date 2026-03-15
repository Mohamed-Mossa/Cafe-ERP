package com.cafe.erp.menu.infrastructure.persistence;
import com.cafe.erp.menu.domain.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface RecipeRepository extends JpaRepository<Recipe, UUID> {
    Optional<Recipe> findByProductId(UUID productId);
}
