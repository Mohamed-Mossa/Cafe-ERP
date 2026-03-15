package com.cafe.erp.promotion.infrastructure.persistence;
import com.cafe.erp.promotion.domain.model.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.*;

public interface PromoCodeRepository extends JpaRepository<PromoCode, UUID> {
    Optional<PromoCode> findByCodeIgnoreCaseAndActiveTrue(String code);
    @Query("SELECT p FROM PromoCode p WHERE p.active = true AND p.endDate >= CURRENT_DATE ORDER BY p.createdAt DESC")
    List<PromoCode> findActivePromoCodes();
}
