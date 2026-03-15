package com.cafe.erp.floor.infrastructure.persistence;
import com.cafe.erp.floor.domain.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; import java.util.UUID;
public interface CafeTableRepository extends JpaRepository<CafeTable, UUID> {
    List<CafeTable> findByDeletedFalseOrderByName();
    List<CafeTable> findByStatusAndDeletedFalse(TableStatus status);
}
