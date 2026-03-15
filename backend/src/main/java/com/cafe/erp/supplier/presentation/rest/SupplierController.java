package com.cafe.erp.supplier.presentation.rest;
import com.cafe.erp.shared.domain.ApiResponse;
import com.cafe.erp.supplier.application.service.SupplierService;
import com.cafe.erp.supplier.domain.model.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/suppliers") @RequiredArgsConstructor
public class SupplierController {
    private final SupplierService service;

    @GetMapping public ResponseEntity<ApiResponse<List<Supplier>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Supplier>> create(@RequestBody Map<String,Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(body)));
    }

    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Supplier>> update(@PathVariable UUID id, @RequestBody Map<String,Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, body)));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id); return ResponseEntity.ok(ApiResponse.success(null));
    }
}
