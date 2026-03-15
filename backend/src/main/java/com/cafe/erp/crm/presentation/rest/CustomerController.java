package com.cafe.erp.crm.presentation.rest;
import com.cafe.erp.crm.application.command.*;
import com.cafe.erp.crm.application.service.CustomerService;
import com.cafe.erp.crm.domain.model.*;
import com.cafe.erp.crm.infrastructure.persistence.CustomerRepository;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.*;

@RestController @RequestMapping("/customers") @RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;
    private final CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String,Object>>> listAll(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="50") int size,
            @RequestParam(required=false) String tier,
            @RequestParam(required=false) String search) {
        var pageable = PageRequest.of(page, size, Sort.by("totalSpent").descending());
        Page<Customer> result;
        if (search != null && !search.isBlank()) {
            result = customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContainingAndDeletedFalse(search, search, pageable);
        } else if (tier != null && !tier.isBlank()) {
            result = customerRepository.findByTierAndDeletedFalse(CustomerTier.valueOf(tier.toUpperCase()), pageable);
        } else {
            result = customerRepository.findByDeletedFalse(pageable);
        }
        var resp = Map.of("customers", result.getContent(), "total", result.getTotalElements(),
                          "page", page, "pages", result.getTotalPages());
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<Customer>> lookup(@RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.success(customerService.lookupByPhone(phone)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> create(@Valid @RequestBody CreateCustomerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Customer created", customerService.createCustomer(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(customerRepository.findById(id).orElseThrow()));
    }

    @PostMapping("/{id}/redeem")
    public ResponseEntity<ApiResponse<BigDecimal>> redeem(@PathVariable UUID id, @Valid @RequestBody RedeemPointsRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Points redeemed", customerService.redeemPoints(id, req)));
    }

    @GetMapping("/{id}/points")
    public ResponseEntity<ApiResponse<List<PointTransaction>>> getPoints(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getPointHistory(id)));
    }

    @GetMapping("/{id}/credit")
    public ResponseEntity<ApiResponse<java.math.BigDecimal>> getCreditBalance(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getCreditBalance(id)));
    }

    @PostMapping("/{id}/topup")
    public ResponseEntity<ApiResponse<java.math.BigDecimal>> topUpCredit(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        java.math.BigDecimal amount = new java.math.BigDecimal(body.get("amount").toString());
        String note = body.containsKey("note") ? body.get("note").toString() : null;
        return ResponseEntity.ok(ApiResponse.success("Credit topped up", customerService.topUpCredit(id, amount, note)));
    }
}
