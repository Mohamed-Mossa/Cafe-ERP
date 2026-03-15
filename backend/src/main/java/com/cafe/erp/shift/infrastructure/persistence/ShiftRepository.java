package com.cafe.erp.shift.infrastructure.persistence;
import com.cafe.erp.shift.domain.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*; import java.util.UUID;
public interface ShiftRepository extends JpaRepository<Shift, UUID> {
    Optional<Shift> findByCashierIdAndStatus(UUID cashierId, ShiftStatus status);
    List<Shift> findByStatusOrderByCreatedAtDesc(ShiftStatus status);

    java.util.List<com.cafe.erp.shift.domain.model.Shift> findAllByOrderByCreatedAtDesc();
}
