package com.cafe.erp.promotion.application.service;
import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.promotion.application.command.CreatePromoRequest;
import com.cafe.erp.promotion.domain.model.*;
import com.cafe.erp.promotion.infrastructure.persistence.PromoCodeRepository;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal; import java.math.RoundingMode;
import java.time.LocalDate; import java.util.List;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

@Service @RequiredArgsConstructor
public class PromoService {
    private final PromoCodeRepository promoRepository;
    private final UserRepository userRepository;

    @Transactional
    public PromoCode createPromo(CreatePromoRequest req) {
        if (promoRepository.findByCodeIgnoreCaseAndActiveTrue(req.getCode()).isPresent())
            throw BusinessException.conflict("Promo code already exists");
        User user = SecurityUtils.currentUser();
        return promoRepository.save(PromoCode.builder()
                .code(req.getCode().toUpperCase()).description(req.getDescription())
                .discountType(req.getDiscountType()).discountValue(req.getDiscountValue())
                .maxUsageCount(req.getMaxUsageCount()).startDate(req.getStartDate())
                .endDate(req.getEndDate()).minimumOrderAmount(req.getMinimumOrderAmount())
                .createdByOwnerId(user.getId()).build());
    }

    /** Validates AND atomically decrements usage count (optimistic lock prevents race) */
    @Transactional
    public PromoValidationResult validateAndApply(String code, BigDecimal orderAmount) {
        PromoCode promo = promoRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .orElseThrow(() -> new BusinessException("Invalid or inactive promo code", HttpStatus.NOT_FOUND));
        LocalDate today = LocalDate.now();
        if (today.isBefore(promo.getStartDate())) throw new BusinessException("Promo code not yet active");
        if (today.isAfter(promo.getEndDate())) throw new BusinessException("Promo code has expired");
        if (promo.getCurrentUsageCount() >= promo.getMaxUsageCount())
            throw new BusinessException("Promo code usage limit reached");
        if (promo.getMinimumOrderAmount() != null && orderAmount.compareTo(promo.getMinimumOrderAmount()) < 0)
            throw new BusinessException("Order amount too low for this promo. Minimum: " + promo.getMinimumOrderAmount() + " EGP");

        BigDecimal discount = promo.getDiscountType() == DiscountType.PERCENT
                ? orderAmount.multiply(promo.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : promo.getDiscountValue().min(orderAmount);

        promo.setCurrentUsageCount(promo.getCurrentUsageCount() + 1);
        if (promo.getCurrentUsageCount() >= promo.getMaxUsageCount()) promo.setActive(false);
        promoRepository.save(promo);

        return new PromoValidationResult(promo.getId(), promo.getCode(), discount);
    }

    public List<PromoCode> getActivePromos() { return promoRepository.findActivePromoCodes(); }

    public record PromoValidationResult(java.util.UUID promoId, String code, BigDecimal discountAmount) {}
}
