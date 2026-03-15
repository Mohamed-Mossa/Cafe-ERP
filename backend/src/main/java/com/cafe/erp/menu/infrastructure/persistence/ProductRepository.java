package com.cafe.erp.menu.infrastructure.persistence;
import com.cafe.erp.menu.domain.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByCategoryIdAndActiveAndDeletedFalseOrderByDisplayOrder(UUID categoryId, boolean active);
    List<Product> findByActiveAndDeletedFalseOrderByDisplayOrder(boolean active);
    List<Product> findByAvailableInMatchModeAndActiveAndDeletedFalse(boolean matchMode, boolean active);
    List<Product> findByDeletedFalseOrderByDisplayOrderAscNameAsc();
}
