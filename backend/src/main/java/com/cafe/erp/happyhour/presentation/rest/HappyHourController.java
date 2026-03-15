package com.cafe.erp.happyhour.presentation.rest;
import com.cafe.erp.happyhour.application.service.HappyHourService;
import com.cafe.erp.happyhour.domain.model.HappyHour;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController @RequestMapping("/happy-hours") @RequiredArgsConstructor
public class HappyHourController {
    private final HappyHourService service;

    @GetMapping public ResponseEntity<ApiResponse<List<HappyHour>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/current") public ResponseEntity<ApiResponse<Map<String,Object>>> getCurrent() {
        BigDecimal disc = service.getCurrentDiscount();
        return ResponseEntity.ok(ApiResponse.success(Map.of("active", disc!=null, "discountPercent", disc!=null?disc:BigDecimal.ZERO)));
    }

    @PostMapping @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<HappyHour>> create(@RequestBody Map<String,Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(body)));
    }

    @PatchMapping("/{id}/toggle") @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<HappyHour>> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.toggle(id)));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id); return ResponseEntity.ok(ApiResponse.success(null));
    }
}
