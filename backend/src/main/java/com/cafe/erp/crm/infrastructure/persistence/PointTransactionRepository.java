package com.cafe.erp.crm.infrastructure.persistence;
import com.cafe.erp.crm.domain.model.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.*; import java.util.UUID;
public interface PointTransactionRepository extends JpaRepository<PointTransaction, UUID> {
    List<PointTransaction> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    @Query("SELECT COALESCE(SUM(t.points), 0) FROM PointTransaction t WHERE t.customerId = :customerId")
    int sumPointsByCustomer(UUID customerId);
}
