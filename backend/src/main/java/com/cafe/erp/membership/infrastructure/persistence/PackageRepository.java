package com.cafe.erp.membership.infrastructure.persistence;
import com.cafe.erp.membership.domain.model.MembershipPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface PackageRepository extends JpaRepository<MembershipPackage, UUID> {
    List<MembershipPackage> findByDeletedFalseOrderByName();
    List<MembershipPackage> findByActiveAndDeletedFalse(boolean active);
}
