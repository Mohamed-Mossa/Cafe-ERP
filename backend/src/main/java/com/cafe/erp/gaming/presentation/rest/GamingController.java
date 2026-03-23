package com.cafe.erp.gaming.presentation.rest;
import com.cafe.erp.gaming.application.GamingService;
import com.cafe.erp.gaming.application.command.*;
import com.cafe.erp.gaming.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*; import java.util.UUID;

@RestController @RequestMapping("/gaming") @RequiredArgsConstructor
public class GamingController {
    private final GamingService gamingService;

    // ─── Devices ───────────────────────────────────────────────────────────
    @GetMapping("/devices")
    public ResponseEntity<ApiResponse<List<Device>>> getDevices() {
        return ResponseEntity.ok(ApiResponse.success(gamingService.getAllDevices()));
    }

    @PostMapping("/devices")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Device>> createDevice(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(gamingService.createDevice(body)));
    }

    @PatchMapping("/devices/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Device>> updateDevice(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(gamingService.updateDevice(id, body)));
    }

    @DeleteMapping("/devices/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(@PathVariable UUID id) {
        gamingService.deleteDevice(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── Sessions ──────────────────────────────────────────────────────────
    @GetMapping("/sessions/active")
    public ResponseEntity<ApiResponse<List<GamingSession>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(gamingService.getActiveSessions()));
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<List<GamingSession>>> getHistory(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(gamingService.getSessionHistory(from, to)));
    }

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<GamingSession>> start(@Valid @RequestBody StartSessionRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Session started", gamingService.startSession(req)));
    }

    @PatchMapping("/sessions/{id}/type")
    public ResponseEntity<ApiResponse<GamingSession>> switchType(
            @PathVariable UUID id, @Valid @RequestBody SwitchTypeRequest req) {
        return ResponseEntity.ok(ApiResponse.success(gamingService.switchType(id, req)));
    }

    @PostMapping("/sessions/{id}/end")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> end(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Session ended", toEndResult(gamingService.endSession(id))));
    }

    @PostMapping("/sessions/{id}/end-with-package")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> endWithPackage(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID customerPackageId = UUID.fromString(body.get("customerPackageId").toString());
        return ResponseEntity.ok(ApiResponse.success("Session ended using package",
                toEndResult(gamingService.endSessionWithPackage(id, customerPackageId))));
    }

    @PostMapping("/sessions/{id}/order")
    public ResponseEntity<ApiResponse<GamingSession>> addFnbOrder(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID productId = UUID.fromString((String) body.get("productId"));
        int quantity = Integer.parseInt(body.getOrDefault("quantity", 1).toString());
        return ResponseEntity.ok(ApiResponse.success(gamingService.addFnbItem(id, productId, quantity)));
    }

    @PostMapping("/sessions/{id}/transfer")
    public ResponseEntity<ApiResponse<GamingSession>> transferSession(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID targetDeviceId = UUID.fromString((String) body.get("targetDeviceId"));
        return ResponseEntity.ok(ApiResponse.success(gamingService.transferSession(id, targetDeviceId)));
    }

    private Map<String, Object> toEndResult(com.cafe.erp.gaming.application.EndSessionResult endResult) {
        GamingSession session = endResult.session();
        var result = new java.util.LinkedHashMap<String,Object>();
        result.put("linkedOrderId", endResult.linkedOrderId() != null ? endResult.linkedOrderId().toString() : null);
        result.put("gamingAmount", session.getGamingAmount());
        result.put("totalMinutes", session.getTotalMinutes());
        result.put("deviceName", session.getDeviceName());
        result.put("packageUsed", endResult.packageUsed());
        result.put("customerPackageId", endResult.customerPackageId() != null ? endResult.customerPackageId().toString() : null);
        result.put("deductedHours", endResult.deductedHours());
        return result;
    }
}
