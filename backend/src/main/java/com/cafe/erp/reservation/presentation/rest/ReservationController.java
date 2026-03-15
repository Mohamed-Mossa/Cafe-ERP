package com.cafe.erp.reservation.presentation.rest;
import com.cafe.erp.reservation.application.service.ReservationService;
import com.cafe.erp.reservation.domain.model.Reservation;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController @RequestMapping("/reservations") @RequiredArgsConstructor
public class ReservationController {
    private final ReservationService service;

    @GetMapping public ResponseEntity<ApiResponse<List<Reservation>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/date/{date}") public ResponseEntity<ApiResponse<List<Reservation>>> getForDate(
            @PathVariable @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(service.getForDate(date)));
    }

    @PostMapping public ResponseEntity<ApiResponse<Reservation>> create(@RequestBody Map<String,Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(service.create(body)));
    }

    @PatchMapping("/{id}/status") public ResponseEntity<ApiResponse<Reservation>> updateStatus(
            @PathVariable UUID id, @RequestBody Map<String,String> body) {
        return ResponseEntity.ok(ApiResponse.success(service.updateStatus(id, body.get("status"))));
    }

    @PatchMapping("/{id}/deposit") public ResponseEntity<ApiResponse<Reservation>> markDeposit(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.markDepositPaid(id)));
    }

    @DeleteMapping("/{id}") public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id); return ResponseEntity.ok(ApiResponse.success(null));
    }
}
