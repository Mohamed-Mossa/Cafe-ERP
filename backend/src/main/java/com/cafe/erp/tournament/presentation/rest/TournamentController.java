package com.cafe.erp.tournament.presentation.rest;

import com.cafe.erp.shared.domain.ApiResponse;
import com.cafe.erp.tournament.application.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/tournaments") @RequiredArgsConstructor
public class TournamentController {
    private final TournamentService service;

    @GetMapping
    public ResponseEntity<?> getAll() { return ResponseEntity.ok(ApiResponse.success(service.getAll())); }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getTournamentDetail(id)));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.create(body)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(service.updateStatus(id, body.get("status"))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/players")
    public ResponseEntity<?> registerPlayer(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.registerPlayer(id, body)));
    }

    @PatchMapping("/players/{playerId}")
    public ResponseEntity<?> updatePlayer(@PathVariable UUID playerId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(service.updatePlayer(playerId, body)));
    }

    @DeleteMapping("/players/{playerId}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<?> removePlayer(@PathVariable UUID playerId) {
        service.removePlayer(playerId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
