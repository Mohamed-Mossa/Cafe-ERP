package com.cafe.erp.membership.infrastructure.persistence;
import com.cafe.erp.membership.domain.model.CustomerPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;
public interface CustomerPackageRepository extends JpaRepository<CustomerPackage, UUID> {
    List<CustomerPackage> findByCustomerIdAndDeletedFalseOrderByCreatedAtDesc(UUID customerId);
    List<CustomerPackage> findByCustomerIdAndActiveAndDeletedFalse(UUID customerId, boolean active);
    Optional<CustomerPackage> findByIdAndCustomerIdAndDeletedFalse(UUID id, UUID customerId);
}
