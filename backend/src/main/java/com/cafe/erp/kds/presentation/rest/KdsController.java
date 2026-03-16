package com.cafe.erp.kds.presentation.rest;
import com.cafe.erp.pos.domain.model.*;
import com.cafe.erp.pos.infrastructure.persistence.*;
import com.cafe.erp.shared.domain.ApiResponse;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/kds") @RequiredArgsConstructor
public class KdsController {
    private final OrderRepository orderRepo;
    private final OrderLineRepository lineRepo;
    private final SimpMessagingTemplate messaging;

    /** All open orders with kitchen-relevant lines only (excludes gaming fee lines) */
    @GetMapping("/orders")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('OWNER','MANAGER','SUPERVISOR','CASHIER','KITCHEN','BARISTA')")
    public ResponseEntity<ApiResponse<List<Order>>> getKitchenOrders() {
        List<Order> orders = orderRepo.findByStatusAndDeletedFalse(OrderStatus.OPEN);

        // Strip lines that are not kitchen items:
        // - productId == null means it is an auto-generated gaming fee line (no recipe, no prep)
        // - GAMING source orders that have only a fee line still appear so cashier can see F&B items
        orders.forEach(o -> o.getLines().removeIf(line -> line.getProductId() == null));

        // Drop orders that have zero kitchen lines after filtering
        orders.removeIf(o -> o.getLines().isEmpty());

        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /** Update status of a single line: NEW→PREPARING→READY→SERVED */
    @PatchMapping("/lines/{lineId}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('OWNER','MANAGER','SUPERVISOR','CASHIER','KITCHEN','BARISTA')")
    public ResponseEntity<ApiResponse<OrderLine>> updateLineStatus(
            @PathVariable UUID lineId,
            @RequestBody Map<String,String> body) {
        OrderLine line = lineRepo.findById(lineId)
                .orElseThrow(() -> BusinessException.notFound("Order line"));
        KitchenStatus newStatus = KitchenStatus.valueOf(body.get("status"));
        line.setKitchenStatus(newStatus);
        OrderLine saved = lineRepo.save(line);
        messaging.convertAndSend("/topic/kds", saved);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    /** Mark all lines in an order as a given status */
    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<List<OrderLine>>> updateOrderStatus(
            @PathVariable UUID orderId,
            @RequestBody Map<String,String> body) {
        KitchenStatus newStatus = KitchenStatus.valueOf(body.get("status"));
        List<OrderLine> lines = lineRepo.findByOrderId(orderId);
        lines.forEach(l -> l.setKitchenStatus(newStatus));
        List<OrderLine> saved = lineRepo.saveAll(lines);
        messaging.convertAndSend("/topic/kds", Map.of("orderId", orderId, "status", newStatus));
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
