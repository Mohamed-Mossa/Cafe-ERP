package com.cafe.erp.crm.infrastructure.persistence;
import com.cafe.erp.crm.domain.model.Customer;
import com.cafe.erp.crm.domain.model.CustomerTier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByIdAndDeletedFalse(UUID id);
    Optional<Customer> findByPhoneAndDeletedFalse(String phone);
    boolean existsByPhone(String phone);
    Page<Customer> findByDeletedFalse(Pageable pageable);
    Page<Customer> findByTierAndDeletedFalse(CustomerTier tier, Pageable pageable);
    Page<Customer> findByFullNameContainingIgnoreCaseAndDeletedFalse(String name, Pageable pageable);
    Page<Customer> findByFullNameContainingIgnoreCaseOrPhoneContainingAndDeletedFalse(String name, String phone, Pageable pageable);
}
