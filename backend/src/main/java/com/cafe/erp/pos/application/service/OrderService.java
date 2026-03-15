package com.cafe.erp.pos.application.service;

import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.menu.infrastructure.persistence.ProductRepository;
import com.cafe.erp.pos.application.command.*;
import com.cafe.erp.pos.domain.model.*;
import com.cafe.erp.pos.infrastructure.persistence.*;
import com.cafe.erp.floor.domain.model.CafeTable;
import com.cafe.erp.floor.domain.model.TableStatus;
import com.cafe.erp.floor.infrastructure.persistence.CafeTableRepository;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cafe.erp.promotion.application.service.PromoService;
import com.cafe.erp.crm.application.service.CustomerService;
import com.cafe.erp.menu.infrastructure.persistence.RecipeRepository;
import com.cafe.erp.inventory.application.service.InventoryService;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderLineRepository orderLineRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PromoService promoService;
    private final CustomerService customerService;
    private final RecipeRepository recipeRepository;
    private final InventoryService inventoryService;
    private final CafeTableRepository cafeTableRepository;

    @Transactional
    public Order createOrder(CreateOrderRequest req) {
        User user = SecurityUtils.currentUser();

        // Check no open order on the same table/device
        if (req.getTableId() != null) {
            List<Order> existing = orderRepository
                    .findByTableIdAndStatusAndDeletedFalse(req.getTableId(), OrderStatus.OPEN);
            if (!existing.isEmpty()) {
                throw BusinessException.conflict("Table already has an open order");
            }
        }

        Long nextNumber = orderRepository.findMaxOrderNumber();
        nextNumber = (nextNumber == null ? 0L : nextNumber) + 1;

        Order order = Order.builder()
                .orderNumber(nextNumber)
                .source(req.getSource())
                .tableId(req.getTableId())
                .tableName(req.getTableName())
                .deviceId(req.getDeviceId())
                .deviceName(req.getDeviceName())
                .cashierId(user.getId())
                .cashierName(user.getFullName())
                .customerId(req.getCustomerId())
                .status(OrderStatus.OPEN)
                .build();

        Order saved = orderRepository.save(order);
        broadcastOrderUpdate(saved);

        // If this is a table order, mark the table as OCCUPIED
        if (req.getTableId() != null) {
            cafeTableRepository.findById(req.getTableId()).ifPresent(table -> {
                table.setStatus(TableStatus.OCCUPIED);
                table.setCurrentOrderId(saved.getId());
                CafeTable updatedTable = cafeTableRepository.save(table);
                messagingTemplate.convertAndSend("/topic/tables", updatedTable);
            });
        }

        return saved;
    }

    @Transactional
    public Order addLine(UUID orderId, AddLineRequest req) {
        Order order = getOpenOrder(orderId);

        var product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> BusinessException.notFound("Product"));

        if (!product.isActive()) {
            throw new BusinessException("Product is not available");
        }

        OrderLine line = OrderLine.builder()
                .orderId(orderId)
                .productId(product.getId())
                .productName(product.getName())
                .quantity(req.getQuantity())
                .unitPrice(product.getSellingPrice())
                .totalPrice(product.getSellingPrice().multiply(BigDecimal.valueOf(req.getQuantity())))
                .notes(req.getNotes())
                .build();

        orderLineRepository.save(line);
        order.getLines().add(line);
        order.recalculateTotals();

        Order updated = orderRepository.save(order);
        broadcastOrderUpdate(updated);
        return updated;
    }

    @Transactional
    public Order removeLine(UUID orderId, UUID lineId) {
        Order order = getOpenOrder(orderId);

        OrderLine line = orderLineRepository.findById(lineId)
                .orElseThrow(() -> BusinessException.notFound("Order line"));

        if (!line.getOrderId().equals(orderId)) {
            throw new BusinessException("Line does not belong to this order");
        }

        orderLineRepository.delete(line);
        order.getLines().removeIf(l -> l.getId().equals(lineId));
        order.recalculateTotals();

        Order updated = orderRepository.save(order);
        broadcastOrderUpdate(updated);
        return updated;
    }

    @Transactional
    public Order applyManualDiscount(UUID orderId, ApplyDiscountRequest req, int userMaxDiscount) {
        Order order = getOpenOrder(orderId);

        if (req.getDiscountPercent().compareTo(BigDecimal.valueOf(userMaxDiscount)) > 0) {
            throw new BusinessException(
                    "Your role allows maximum " + userMaxDiscount + "% discount",
                    HttpStatus.FORBIDDEN
            );
        }

        BigDecimal discount = order.getSubtotal()
                .multiply(req.getDiscountPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        order.setDiscountAmount(discount);
        order.setDiscountType("MANUAL");
        order.recalculateTotals();

        return orderRepository.save(order);
    }

    @Transactional
    public Order processPayment(UUID orderId, ProcessPaymentRequest req) {
        Order order = getOpenOrder(orderId);

        BigDecimal totalPaid = req.getPayments().stream()
                .map(ProcessPaymentRequest.PaymentEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPaid.compareTo(order.getGrandTotal()) < 0) {
            throw new BusinessException("Payment amount is less than the grand total");
        }

        // Deduct customer credit for CREDIT payment method
        if (order.getCustomerId() != null) {
            java.math.BigDecimal creditUsed = req.getPayments().stream()
                .filter(p -> "CREDIT".equals(p.getMethod() != null ? p.getMethod().name() : ""))
                .map(p -> p.getAmount())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
            if (creditUsed.compareTo(java.math.BigDecimal.ZERO) > 0) {
                try {
                    customerService.deductCredit(order.getCustomerId(), creditUsed);
                } catch (Exception e) {
                    throw new BusinessException("Credit payment failed: " + e.getMessage());
                }
            }
        }

        // Create payment records
        req.getPayments().forEach(entry -> {
            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .method(entry.getMethod())
                    .amount(entry.getAmount())
                    .reference(entry.getReference())
                    .build();
            order.getPayments().add(payment);
        });

        // Close the order
        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(LocalDateTime.now());

        Order closed = orderRepository.save(order);

        // Broadcast update
        broadcastOrderUpdate(closed);

        // Award loyalty points if customer linked
        if (closed.getCustomerId() != null) {
            try {
                var customer = customerService.earnPoints(closed.getCustomerId(), closed.getGrandTotal(), closed.getId());
                int pts = closed.getGrandTotal().divide(java.math.BigDecimal.valueOf(100), 0, java.math.RoundingMode.FLOOR).multiply(java.math.BigDecimal.valueOf(10)).intValue();
                closed.setLoyaltyPointsEarned(pts);
                orderRepository.save(closed);
            } catch (Exception e) {
                log.warn("Failed to award loyalty points: {}", e.getMessage());
            }
        }
        // Deduct inventory via recipes
        closed.getLines().forEach(line -> {
            try {
                inventoryService.deductForOrder(line.getProductId(), line.getQuantity(), closed.getId());
            } catch (Exception e) {
                log.warn("Inventory deduction failed for product {}: {}", line.getProductId(), e.getMessage());
            }
        });
        log.info("Order #{} closed. Total: {} EGP", closed.getOrderNumber(), closed.getGrandTotal());

        // If this was a table order, reset the table to FREE
        if (closed.getTableId() != null) {
            freeTable(closed.getTableId());
        }

        return closed;
    }

    @Transactional
    public void cancelOrder(UUID orderId, String reason) {
        Order order = getOpenOrder(orderId);
        order.setStatus(OrderStatus.CANCELLED);
        order.setClosedAt(LocalDateTime.now());
        orderRepository.save(order);
        broadcastOrderUpdate(order);
        log.info("Order #{} cancelled. Reason: {}", order.getOrderNumber(), reason);

        // If this was a table order, reset the table to FREE
        if (order.getTableId() != null) {
            freeTable(order.getTableId());
        }
    }

    @Transactional
    public Order applyPromoCode(UUID orderId, String promoCode) {
        Order order = getOpenOrder(orderId);
        PromoService.PromoValidationResult result =
                promoService.validateAndApply(promoCode, order.getSubtotal());
        order.setDiscountAmount(result.discountAmount());
        order.setDiscountType("PROMO");
        order.setPromoCodeApplied(result.code());
        order.setPromoCodeId(result.promoId());
        order.recalculateTotals();
        Order saved = orderRepository.save(order);
        broadcastOrderUpdate(saved);
        return saved;
    }


    @Transactional
    public Order transferOrder(UUID orderId, UUID newTableId, String newTableName) {
        Order order = getOpenOrder(orderId);
        order.setTableId(newTableId);
        order.setTableName(newTableName);
        Order saved = orderRepository.save(order);
        broadcastOrderUpdate(saved);
        return saved;
    }

    @Transactional
    public Order attachCustomer(UUID orderId, UUID customerId, String customerName) {
        Order order = getOpenOrder(orderId);
        order.setCustomerId(customerId);
        order.setCustomerName(customerName);
        Order saved = orderRepository.save(order);
        broadcastOrderUpdate(saved);
        return saved;
    }

    public List<Order> getOpenOrders() {
        return orderRepository.findByStatusAndDeletedFalse(OrderStatus.OPEN);
    }

    public Order getOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> BusinessException.notFound("Order"));
    }

    private Order getOpenOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> BusinessException.notFound("Order"));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Order is not open. Status: " + order.getStatus());
        }
        return order;
    }

    private void broadcastOrderUpdate(Order order) {
        messagingTemplate.convertAndSend("/topic/orders", order);
    }

    /** Reset a table to FREE status and broadcast the change */
    private void freeTable(UUID tableId) {
        cafeTableRepository.findById(tableId).ifPresent(table -> {
            table.setStatus(TableStatus.FREE);
            table.setCurrentOrderId(null);
            CafeTable updatedTable = cafeTableRepository.save(table);
            messagingTemplate.convertAndSend("/topic/tables", updatedTable);
        });
    }

    @Transactional
    public Order addGamingFee(UUID orderId, String deviceName, int minutes, java.math.BigDecimal amount) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> BusinessException.notFound("Order"));
        if (order.getStatus() != OrderStatus.OPEN) {
            log.warn("Cannot add gaming fee to non-open order {}", orderId);
            return order;
        }
        String label = String.format("Gaming - %s (%d min)", deviceName, minutes);
        OrderLine line = OrderLine.builder()
            .orderId(orderId)
            .productId(null)
            .productName(label)
            .quantity(1)
            .unitPrice(amount)
            .totalPrice(amount)
            .notes("Auto-charged gaming session")
            .build();
        orderLineRepository.save(line);
        order.getLines().add(line);
        order.recalculateTotals();
        Order updated = orderRepository.save(order);
        broadcastOrderUpdate(updated);
        return updated;
    }

    @Transactional
    public Order updateLineNotes(UUID orderId, UUID lineId, String notes) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> BusinessException.notFound("Order"));
        OrderLine line = orderLineRepository.findById(lineId)
            .orElseThrow(() -> BusinessException.notFound("Order line"));
        line.setNotes(notes);
        orderLineRepository.save(line);
        broadcastOrderUpdate(order);
        return order;
    }

    /** Merge all lines from sourceOrder into targetOrder, then cancel sourceOrder */
    @Transactional
    public Order mergeOrders(UUID sourceOrderId, UUID targetOrderId) {
        Order source = getOpenOrder(sourceOrderId);
        Order target = getOpenOrder(targetOrderId);
        // Move all lines
        source.getLines().forEach(line -> {
            OrderLine newLine = OrderLine.builder()
                .orderId(targetOrderId)
                .productId(line.getProductId())
                .productName(line.getProductName())
                .quantity(line.getQuantity())
                .unitPrice(line.getUnitPrice())
                .totalPrice(line.getTotalPrice())
                .notes(line.getNotes())
                .build();
            orderLineRepository.save(newLine);
            target.getLines().add(newLine);
        });
        target.recalculateTotals();
        Order updated = orderRepository.save(target);
        // Cancel source order
        source.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(source);
        broadcastOrderUpdate(updated);
        return updated;
    }
}
