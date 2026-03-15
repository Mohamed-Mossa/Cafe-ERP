package com.cafe.erp.shift.infrastructure.persistence;
import com.cafe.erp.shift.domain.model.PettyExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal; import java.util.*; import java.util.UUID;
public interface PettyExpenseRepository extends JpaRepository<PettyExpense, UUID> {
    List<PettyExpense> findByShiftId(UUID shiftId);
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM PettyExpense e WHERE e.shiftId = :shiftId")
    BigDecimal sumByShiftId(UUID shiftId);
}
