package com.cafe.erp.menu.infrastructure.persistence;
import com.cafe.erp.menu.domain.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByActiveAndDeletedFalseOrderByDisplayOrder(boolean active);
}
