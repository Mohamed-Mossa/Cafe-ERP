package com.cafe.erp.pos.presentation.rest;

import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.pos.application.command.*;
import com.cafe.erp.pos.application.service.OrderService;
import com.cafe.erp.pos.domain.model.Order;
import com.cafe.erp.pos.infrastructure.persistence.OrderRepository;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepo;

    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<Order>>> getOpenOrders() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOpenOrders()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrder(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> createOrder(@Valid @RequestBody CreateOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created", orderService.createOrder(req)));
    }

    @PostMapping("/{id}/lines")
    public ResponseEntity<ApiResponse<Order>> addLine(
            @PathVariable UUID id, @Valid @RequestBody AddLineRequest req) {
        return ResponseEntity.ok(ApiResponse.success(orderService.addLine(id, req)));
    }

    // Any logged-in user can remove a line from their own order
    @DeleteMapping("/{id}/lines/{lineId}")
    public ResponseEntity<ApiResponse<Order>> removeLine(
            @PathVariable UUID id, @PathVariable UUID lineId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.removeLine(id, lineId)));
    }

    // Use the authenticated user's actual max discount, not a hardcoded value
    @PostMapping("/{id}/discount")
    public ResponseEntity<ApiResponse<Order>> applyDiscount(
            @PathVariable UUID id,
            @Valid @RequestBody ApplyDiscountRequest req,
            @AuthenticationPrincipal User user) {
        int maxDiscount = (user != null) ? user.getMaxDiscountByRole() : 5;
        return ResponseEntity.ok(ApiResponse.success(
                orderService.applyManualDiscount(id, req, maxDiscount)));
    }

    // Apply a promo code to an order
    @PostMapping("/{id}/promo")
    public ResponseEntity<ApiResponse<Order>> applyPromo(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.applyPromoCode(id, body.get("promoCode"))));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<Order>> processPayment(
            @PathVariable UUID id, @Valid @RequestBody ProcessPaymentRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Payment processed",
                orderService.processPayment(id, req)));
    }

    // Any logged-in user can cancel (supervisor check is done in service if needed)
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        orderService.cancelOrder(id, body != null ? body.get("reason") : null);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    @PostMapping("/{id}/transfer")
    public ResponseEntity<ApiResponse<Order>> transferOrder(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID tableId = UUID.fromString((String) body.get("tableId"));
        String tableName = (String) body.get("tableName");
        return ResponseEntity.ok(ApiResponse.success(orderService.transferOrder(id, tableId, tableName)));
    }

    @PostMapping("/{id}/customer")
    public ResponseEntity<ApiResponse<Order>> attachCustomer(
            @PathVariable UUID id, @RequestBody Map<String, String> body) {
        UUID customerId = UUID.fromString(body.get("customerId"));
        return ResponseEntity.ok(ApiResponse.success(
                orderService.attachCustomer(id, customerId, body.get("customerName"))));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<ApiResponse<Order>> getReceipt(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrder(id)));
    }

    @GetMapping("/history")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.List<Order>>> getHistory(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required=false) String source) {
        var orders = orderRepo.findByClosedAtBetweenAndDeletedFalse(from, to);
        if (source != null && !source.isBlank()) {
            orders = orders.stream().filter(o -> o.getSource().name().equals(source)).toList();
        }
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PatchMapping("/{id}/lines/{lineId}")
    public ResponseEntity<ApiResponse<Order>> updateLine(
            @PathVariable UUID id, @PathVariable UUID lineId,
            @RequestBody Map<String, Object> body) {
        // Handle quantity change
        if (body.containsKey("quantity")) {
            int qty = Integer.parseInt(body.get("quantity").toString());
            return ResponseEntity.ok(ApiResponse.success(orderService.updateLineQuantity(id, lineId, qty)));
        }
        // Handle notes only
        String notes = body.containsKey("notes") ? body.get("notes").toString() : "";
        return ResponseEntity.ok(ApiResponse.success(
            orderService.updateLineNotes(id, lineId, notes)));
    }
}
