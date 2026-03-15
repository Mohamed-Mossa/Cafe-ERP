package com.cafe.erp.menu.presentation.rest;

import com.cafe.erp.menu.application.command.*;
import com.cafe.erp.menu.application.service.MenuService;
import com.cafe.erp.menu.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getActiveCategories()));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<Product>>> getProducts(
            @RequestParam(required=false) UUID categoryId,
            @RequestParam(defaultValue="false") boolean all) {
        List<Product> products;
        if (all) products = menuService.getAllProductsForManagement();
        else if (categoryId != null) products = menuService.getProductsByCategory(categoryId);
        else products = menuService.getActiveProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/products/match-mode")
    public ResponseEntity<ApiResponse<List<Product>>> getMatchModeProducts() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getMatchModeProducts()));
    }

    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody CreateProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created", menuService.createProduct(req)));
    }

    @PatchMapping("/products/{id}/price")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Product>> updatePrice(
            @PathVariable UUID id, @Valid @RequestBody UpdatePriceRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Price updated", menuService.updatePrice(id, req)));
    }

    @PatchMapping("/products/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> toggle(@PathVariable UUID id) {
        menuService.toggleProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/products/{id}/recipe")
    public ResponseEntity<ApiResponse<Recipe>> getRecipe(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(menuService.getOrCreateRecipe(id)));
    }

    @PutMapping("/products/{id}/recipe")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Recipe>> saveRecipe(
            @PathVariable UUID id, @RequestBody Map<String,Object> body) {
        return ResponseEntity.ok(ApiResponse.success(menuService.saveRecipe(id, body)));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Map<String,Object> body) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success(menuService.createCategory(body)));
    }

    @PatchMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @PathVariable UUID id, @RequestBody Map<String,Object> body) {
        return ResponseEntity.ok(ApiResponse.success(menuService.updateCategory(id, body)));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        menuService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/products/{id}/cost")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Product>> updateCost(
            @PathVariable UUID id, @RequestBody java.util.Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(menuService.updateCost(id, body)));
    }
}
