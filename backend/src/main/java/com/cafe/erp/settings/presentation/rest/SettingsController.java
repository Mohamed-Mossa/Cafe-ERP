package com.cafe.erp.settings.presentation.rest;

import com.cafe.erp.settings.application.service.SettingsService;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController @RequestMapping("/settings") @RequiredArgsConstructor
public class SettingsController {
    private final SettingsService service;

    @GetMapping
    public ResponseEntity<?> getAll() { return ResponseEntity.ok(ApiResponse.success(service.getAllSettings())); }

    @PutMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> update(@RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(ApiResponse.success(service.updateSettings(updates)));
    }
}
