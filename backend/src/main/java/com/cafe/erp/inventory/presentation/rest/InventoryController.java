package com.cafe.erp.inventory.presentation.rest;
import com.cafe.erp.inventory.application.command.*;
import com.cafe.erp.inventory.application.service.InventoryService;
import com.cafe.erp.inventory.domain.model.InventoryItem;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/inventory") @RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;
    private final com.cafe.erp.supplier.application.service.SupplierService supplierService;
    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllItems()));
    }
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getAlerts() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockAlerts()));
    }
    @PostMapping("/purchases")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<InventoryItem>> purchase(@Valid @RequestBody AddPurchaseRequest req) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.addPurchase(req)));
    }
    @PostMapping("/wastage")
    public ResponseEntity<ApiResponse<InventoryItem>> wastage(@Valid @RequestBody RecordWastageRequest req) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.recordWastage(req)));
    }
    @PostMapping("/count")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<InventoryItem>> count(@Valid @RequestBody StockCountRequest req) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.stockCount(req)));
    }
    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<InventoryItem>> createItem(@RequestBody Map<String,Object> body) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.createItem(body)));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<InventoryItem>> updateItem(@PathVariable UUID id, @RequestBody Map<String,Object> body) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateItem(id, body)));
    }

    @GetMapping("/ledger/{itemId}")
    public ResponseEntity<ApiResponse<List<com.cafe.erp.inventory.domain.model.StockLedger>>> getLedger(@PathVariable UUID itemId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLedger(itemId)));
    }

    @GetMapping("/purchases")
    public ResponseEntity<ApiResponse<List<com.cafe.erp.inventory.domain.model.Purchase>>> getPurchases() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getRecentPurchases()));
    }

    @GetMapping("/suppliers")
    public ResponseEntity<ApiResponse<List<com.cafe.erp.supplier.domain.model.Supplier>>> getSuppliers() {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getActive()));
    }
}
