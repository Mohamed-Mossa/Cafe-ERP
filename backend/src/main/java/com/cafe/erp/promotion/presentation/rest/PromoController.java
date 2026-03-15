package com.cafe.erp.promotion.presentation.rest;
import com.cafe.erp.promotion.application.command.CreatePromoRequest;
import com.cafe.erp.promotion.application.service.PromoService;
import com.cafe.erp.promotion.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.time.LocalDate; import java.util.*;

@RestController @RequestMapping("/promos") @RequiredArgsConstructor
public class PromoController {
    private final PromoService promoService;
    private final com.cafe.erp.promotion.infrastructure.persistence.PromoCodeRepository promoRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PromoCode>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(promoRepository.findAll(
            org.springframework.data.domain.Sort.by("createdAt").descending())));
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<PromoCode>> create(@Valid @RequestBody CreatePromoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Promo created", promoService.createPromo(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','MANAGER')")
    public ResponseEntity<ApiResponse<PromoCode>> update(@PathVariable UUID id, @RequestBody Map<String,Object> body) {
        var promo = promoRepository.findById(id).orElseThrow();
        if (body.containsKey("code"))               promo.setCode((String) body.get("code"));
        if (body.containsKey("description"))        promo.setDescription((String) body.get("description"));
        if (body.containsKey("discountValue"))      promo.setDiscountValue(new BigDecimal(body.get("discountValue").toString()));
        if (body.containsKey("maxUsageCount"))      promo.setMaxUsageCount(Integer.parseInt(body.get("maxUsageCount").toString()));
        if (body.containsKey("minimumOrderAmount")) promo.setMinimumOrderAmount(new BigDecimal(body.get("minimumOrderAmount").toString()));
        if (body.containsKey("active"))             promo.setActive((Boolean) body.get("active"));
        if (body.containsKey("startDate"))          promo.setStartDate(LocalDate.parse((String) body.get("startDate")));
        if (body.containsKey("endDate"))            promo.setEndDate(LocalDate.parse((String) body.get("endDate")));
        return ResponseEntity.ok(ApiResponse.success(promoRepository.save(promo)));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('OWNER','MANAGER')")
    public ResponseEntity<ApiResponse<PromoCode>> toggle(@PathVariable UUID id) {
        var promo = promoRepository.findById(id).orElseThrow();
        promo.setActive(!promo.isActive());
        return ResponseEntity.ok(ApiResponse.success(promoRepository.save(promo)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        promoRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<PromoService.PromoValidationResult>> validate(
            @RequestParam String code, @RequestParam BigDecimal orderAmount) {
        return ResponseEntity.ok(ApiResponse.success(promoService.validateAndApply(code, orderAmount)));
    }
}
