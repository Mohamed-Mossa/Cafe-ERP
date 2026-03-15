package com.cafe.erp.expense.presentation.rest;

import com.cafe.erp.expense.application.service.ExpenseService;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/expenses") @RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseService service;

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() { return ResponseEntity.ok(ApiResponse.success(service.getCategories())); }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> createCategory(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.createCategory(body)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','OWNER','SUPERVISOR')")
    public ResponseEntity<?> getExpenses(@RequestParam(required = false) String from,
                                          @RequestParam(required = false) String to) {
        return ResponseEntity.ok(ApiResponse.success(service.getExpenses(from, to)));
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.createExpense(body)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
