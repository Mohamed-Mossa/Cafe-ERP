package com.cafe.erp.membership.application.service;

import com.cafe.erp.membership.domain.model.CustomerPackage;
import com.cafe.erp.membership.domain.model.MembershipPackage;
import com.cafe.erp.membership.infrastructure.persistence.CustomerPackageRepository;
import com.cafe.erp.membership.infrastructure.persistence.PackageRepository;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class MembershipService {
    private final PackageRepository packageRepo;
    private final CustomerPackageRepository customerPkgRepo;

    // ── Package CRUD ──────────────────────────────────────────────────────────
    public List<MembershipPackage> getAllPackages() { return packageRepo.findByDeletedFalseOrderByName(); }

    @Transactional
    public MembershipPackage createPackage(Map<String, Object> body) {
        return packageRepo.save(MembershipPackage.builder()
            .name((String) body.get("name"))
            .description((String) body.getOrDefault("description", ""))
            .deviceType((String) body.getOrDefault("deviceType", "ANY"))
            .sessionType((String) body.getOrDefault("sessionType", "ANY"))
            .hoursIncluded(new BigDecimal(body.get("hoursIncluded").toString()))
            .price(new BigDecimal(body.get("price").toString()))
            .validityDays(Integer.parseInt(body.getOrDefault("validityDays", "90").toString()))
            .build());
    }

    @Transactional
    public MembershipPackage updatePackage(UUID id, Map<String, Object> body) {
        MembershipPackage pkg = packageRepo.findById(id).orElseThrow(() -> BusinessException.notFound("Package"));
        if (body.containsKey("name")) pkg.setName((String) body.get("name"));
        if (body.containsKey("description")) pkg.setDescription((String) body.get("description"));
        if (body.containsKey("deviceType")) pkg.setDeviceType((String) body.get("deviceType"));
        if (body.containsKey("sessionType")) pkg.setSessionType((String) body.get("sessionType"));
        if (body.containsKey("hoursIncluded")) pkg.setHoursIncluded(new BigDecimal(body.get("hoursIncluded").toString()));
        if (body.containsKey("price")) pkg.setPrice(new BigDecimal(body.get("price").toString()));
        if (body.containsKey("validityDays")) pkg.setValidityDays(Integer.parseInt(body.get("validityDays").toString()));
        if (body.containsKey("active")) pkg.setActive(Boolean.parseBoolean(body.get("active").toString()));
        return packageRepo.save(pkg);
    }

    @Transactional
    public void deletePackage(UUID id) {
        packageRepo.findById(id).ifPresent(p -> { p.setDeleted(true); packageRepo.save(p); });
    }

    // ── Customer Package Assignment ───────────────────────────────────────────
    public List<CustomerPackage> getCustomerPackages(UUID customerId) {
        return customerPkgRepo.findByCustomerIdAndDeletedFalseOrderByCreatedAtDesc(customerId);
    }

    public List<CustomerPackage> getActiveCustomerPackages(UUID customerId) {
        return customerPkgRepo.findByCustomerIdAndActiveAndDeletedFalse(customerId, true)
            .stream().filter(p -> !p.getExpiresAt().isBefore(LocalDate.now())).toList();
    }

    @Transactional
    public CustomerPackage assignPackage(UUID customerId, UUID packageId) {
        MembershipPackage pkg = packageRepo.findById(packageId).orElseThrow(() -> BusinessException.notFound("Package"));
        var user = SecurityUtils.currentUser();
        CustomerPackage cp = CustomerPackage.builder()
            .customerId(customerId).packageId(packageId)
            .packageName(pkg.getName())
            .hoursRemaining(pkg.getHoursIncluded())
            .hoursPurchased(pkg.getHoursIncluded())
            .purchasePrice(pkg.getPrice())
            .expiresAt(LocalDate.now().plusDays(pkg.getValidityDays()))
            .cashierId(user.getId())
            .deviceType(pkg.getDeviceType())
            .sessionType(pkg.getSessionType())
            .build();
        return customerPkgRepo.save(cp);
    }

    @Transactional
    public CustomerPackage deductHours(UUID customerPackageId, BigDecimal hours) {
        CustomerPackage cp = customerPkgRepo.findById(customerPackageId)
            .orElseThrow(() -> BusinessException.notFound("CustomerPackage"));
        if (!cp.isActive()) throw new BusinessException("Package is no longer active");
        if (cp.getExpiresAt().isBefore(LocalDate.now())) throw new BusinessException("Package has expired");
        if (cp.getHoursRemaining().compareTo(hours) < 0)
            throw new BusinessException("Insufficient hours. Available: " + cp.getHoursRemaining());
        cp.setHoursRemaining(cp.getHoursRemaining().subtract(hours));
        if (cp.getHoursRemaining().compareTo(BigDecimal.ZERO) <= 0) cp.setActive(false);
        return customerPkgRepo.save(cp);
    }
}
