package com.cafe.erp.floor.presentation.rest;
import com.cafe.erp.floor.application.service.FloorService;
import com.cafe.erp.floor.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List; import java.util.Map; import java.util.UUID;

@RestController @RequestMapping("/floor") @RequiredArgsConstructor
public class FloorController {
    private final FloorService floorService;

    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<CafeTable>>> getTables() {
        return ResponseEntity.ok(ApiResponse.success(floorService.getAllTables()));
    }

    @PostMapping("/tables")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<CafeTable>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(floorService.createTable(
                (String) body.get("name"),
                Integer.parseInt(body.getOrDefault("capacity", 4).toString()),
                Integer.parseInt(body.getOrDefault("posX", 0).toString()),
                Integer.parseInt(body.getOrDefault("posY", 0).toString()))));
    }

    @PatchMapping("/tables/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<CafeTable>> update(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(floorService.updateTable(id, body)));
    }

    @DeleteMapping("/tables/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        floorService.deleteTable(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/tables/merge")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER','SUPERVISOR')")
    public ResponseEntity<ApiResponse<String>> merge(@RequestBody Map<String, Object> body) {
        UUID sourceId = UUID.fromString((String) body.get("sourceTableId"));
        UUID targetId = UUID.fromString((String) body.get("targetTableId"));
        return ResponseEntity.ok(ApiResponse.success(floorService.mergeTables(sourceId, targetId)));
    }
}
