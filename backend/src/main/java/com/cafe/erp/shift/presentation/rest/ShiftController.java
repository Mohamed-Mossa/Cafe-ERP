package com.cafe.erp.shift.presentation.rest;
import com.cafe.erp.shift.application.command.*;
import com.cafe.erp.shift.application.service.ShiftService;
import com.cafe.erp.shift.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*; import java.util.UUID;

@RestController @RequestMapping("/shifts") @RequiredArgsConstructor
public class ShiftController {
    private final ShiftService shiftService;
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<Shift>> getCurrent() {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getCurrentShift().orElse(null)));
    }
    @PostMapping("/open")
    public ResponseEntity<ApiResponse<Shift>> open(@Valid @RequestBody OpenShiftRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Shift opened", shiftService.openShift(req)));
    }
    @PostMapping("/{id}/expenses")
    public ResponseEntity<ApiResponse<Shift>> addExpense(@PathVariable UUID id, @Valid @RequestBody AddExpenseRequest req) {
        return ResponseEntity.ok(ApiResponse.success(shiftService.addExpense(id, req)));
    }
    @GetMapping("/{id}/expenses")
    public ResponseEntity<ApiResponse<List<PettyExpense>>> getExpenses(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getShiftExpenses(id)));
    }
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<Shift>> close(@PathVariable UUID id, @Valid @RequestBody CloseShiftRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Shift closed", shiftService.closeShift(id, req)));
    }

    @GetMapping("/history")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.List<com.cafe.erp.shift.domain.model.Shift>>> getHistory() {
        return ResponseEntity.ok(ApiResponse.success(shiftService.getAllShifts()));
    }
}
