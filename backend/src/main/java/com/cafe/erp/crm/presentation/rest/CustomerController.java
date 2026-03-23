package com.cafe.erp.crm.presentation.rest;
import com.cafe.erp.crm.application.command.*;
import com.cafe.erp.crm.application.service.CustomerService;
import com.cafe.erp.crm.domain.model.*;
import com.cafe.erp.crm.infrastructure.persistence.CustomerRepository;
import com.cafe.erp.shared.domain.ApiResponse;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.*;

@RestController @RequestMapping("/customers")
public class CustomerController {
    private final CustomerService customerService;
    private final CustomerRepository customerRepository;

    public CustomerController(CustomerService customerService, CustomerRepository customerRepository) {
        this.customerService = customerService;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String,Object>>> listAll(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="50") int size,
            @RequestParam(required=false) String tier,
            @RequestParam(required=false) String search) {
        var pageable = PageRequest.of(page, size, Sort.by("totalSpent").descending());
        boolean canViewPhone = canViewCustomerPhone();
        Page<Customer> result;
        if (search != null && !search.isBlank()) {
            result = canViewPhone
                    ? customerRepository.findByFullNameContainingIgnoreCaseOrPhoneContainingAndDeletedFalse(search, search, pageable)
                    : customerRepository.findByFullNameContainingIgnoreCaseAndDeletedFalse(search, pageable);
        } else if (tier != null && !tier.isBlank()) {
            result = customerRepository.findByTierAndDeletedFalse(CustomerTier.valueOf(tier.toUpperCase()), pageable);
        } else {
            result = customerRepository.findByDeletedFalse(pageable);
        }
        var customers = result.getContent().stream().map(customer -> CustomerView.from(customer, canViewPhone)).toList();
        var resp = Map.of("customers", customers, "total", result.getTotalElements(),
                          "page", page, "pages", result.getTotalPages());
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<CustomerView>> lookup(@RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.success(CustomerView.from(customerService.lookupByPhone(phone), canViewCustomerPhone())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerView>> create(@Valid @RequestBody CreateCustomerRequest req) {
        Customer customer = customerService.createCustomer(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer created", CustomerView.from(customer, canViewCustomerPhone())));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerView>> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Customer customer = customerRepository.findById(id).orElseThrow();
        if (body.containsKey("fullName") && body.get("fullName") != null)
            customer.setFullName(body.get("fullName").toString());
        if (body.containsKey("phone")) {
            if (!canViewCustomerPhone()) {
                throw new BusinessException("Only owner can update customer phone");
            }
            if (body.get("phone") != null) {
                customer.setPhone(body.get("phone").toString());
            }
        }
        if (body.containsKey("email"))
            customer.setEmail(body.get("email") != null ? body.get("email").toString() : null);
        Customer saved = customerRepository.save(customer);
        return ResponseEntity.ok(ApiResponse.success("Customer updated", CustomerView.from(saved, canViewCustomerPhone())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerView>> getById(@PathVariable UUID id) {
        Customer customer = customerRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(CustomerView.from(customer, canViewCustomerPhone())));
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

    /** Set or update the credit limit for a customer (owner/manager only) */
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('OWNER','MANAGER')")
    @PutMapping("/{id}/credit-limit")
    public ResponseEntity<ApiResponse<CustomerView>> setCreditLimit(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        java.math.BigDecimal limit = new java.math.BigDecimal(body.get("creditLimit").toString());
        if (limit.compareTo(java.math.BigDecimal.ZERO) < 0)
            throw new com.cafe.erp.shared.infrastructure.exception.BusinessException("Credit limit must be >= 0");
        Customer customer = customerRepository.findById(id).orElseThrow();
        customer.setCreditLimit(limit);
        Customer saved = customerRepository.save(customer);
        return ResponseEntity.ok(ApiResponse.success("Credit limit updated", CustomerView.from(saved, canViewCustomerPhone())));
    }

    private boolean canViewCustomerPhone() {
        return SecurityUtils.hasRole("OWNER");
    }
}
