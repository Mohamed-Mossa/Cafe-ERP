package com.cafe.erp.supplier.infrastructure.persistence;
import com.cafe.erp.supplier.domain.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    List<Supplier> findByDeletedFalseOrderByName();
    List<Supplier> findByActiveAndDeletedFalseOrderByName(boolean active);
}
