package com.cafe.erp.membership.presentation.rest;

import com.cafe.erp.membership.application.service.MembershipService;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/memberships") @RequiredArgsConstructor
public class MembershipController {
    private final MembershipService service;

    @GetMapping("/packages")
    public ResponseEntity<?> getPackages() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllPackages()));
    }

    @PostMapping("/packages")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> createPackage(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.createPackage(body)));
    }

    @PatchMapping("/packages/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> updatePackage(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.updatePackage(id, body)));
    }

    @DeleteMapping("/packages/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> deletePackage(@PathVariable UUID id) {
        service.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/customers/{customerId}")
    public ResponseEntity<?> getCustomerPackages(@PathVariable UUID customerId) {
        return ResponseEntity.ok(ApiResponse.success(service.getCustomerPackages(customerId)));
    }

    @GetMapping("/customers/{customerId}/active")
    public ResponseEntity<?> getActiveCustomerPackages(@PathVariable UUID customerId) {
        return ResponseEntity.ok(ApiResponse.success(service.getActiveCustomerPackages(customerId)));
    }

    @PostMapping("/customers/{customerId}/assign/{packageId}")
    @PreAuthorize("hasAnyRole('OWNER','MANAGER','SUPERVISOR','CASHIER')")
    public ResponseEntity<?> assignPackage(@PathVariable UUID customerId, @PathVariable UUID packageId) {
        return ResponseEntity.ok(ApiResponse.success(service.assignPackage(customerId, packageId)));
    }

    @PostMapping("/customer-packages/{id}/deduct")
    public ResponseEntity<?> deductHours(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        BigDecimal hours = new BigDecimal(body.get("hours").toString());
        return ResponseEntity.ok(ApiResponse.success(service.deductHours(id, hours)));
    }
}
