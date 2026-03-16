package com.cafe.erp.floor.application.service;
import com.cafe.erp.floor.domain.model.*;
import org.springframework.context.annotation.Lazy;
import com.cafe.erp.floor.infrastructure.persistence.CafeTableRepository;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List; import java.util.Map; import java.util.UUID;

@Service
public class FloorService {
    private final CafeTableRepository tableRepository;
    private final SimpMessagingTemplate messaging;
    private final com.cafe.erp.pos.application.service.OrderService orderService;

    public FloorService(CafeTableRepository tableRepository, SimpMessagingTemplate messaging,
                        @Lazy com.cafe.erp.pos.application.service.OrderService orderService) {
        this.tableRepository = tableRepository;
        this.messaging = messaging;
        this.orderService = orderService;
    }

    public List<CafeTable> getAllTables() { return tableRepository.findByDeletedFalseOrderByName(); }

    @Transactional
    public CafeTable updateTableStatus(UUID tableId, TableStatus status, UUID orderId) {
        CafeTable table = tableRepository.findById(tableId).orElseThrow(() -> BusinessException.notFound("Table"));
        table.setStatus(status);
        table.setCurrentOrderId(status == TableStatus.FREE ? null : orderId);
        CafeTable saved = tableRepository.save(table);
        messaging.convertAndSend("/topic/tables", saved);
        return saved;
    }

    @Transactional
    public CafeTable createTable(String name, int capacity, int posX, int posY) {
        return tableRepository.save(CafeTable.builder().name(name).capacity(capacity).positionX(posX).positionY(posY).build());
    }

    @Transactional
    public CafeTable updateTable(UUID id, Map<String, Object> body) {
        CafeTable table = tableRepository.findById(id).orElseThrow(() -> BusinessException.notFound("Table"));
        if (body.containsKey("name")) table.setName((String) body.get("name"));
        if (body.containsKey("capacity")) table.setCapacity(Integer.parseInt(body.get("capacity").toString()));
        if (body.containsKey("posX")) table.setPositionX(Integer.parseInt(body.get("posX").toString()));
        if (body.containsKey("posY")) table.setPositionY(Integer.parseInt(body.get("posY").toString()));
        if (body.containsKey("status")) {
            table.setStatus(TableStatus.valueOf((String) body.get("status")));
            if (table.getStatus() == TableStatus.FREE || table.getStatus() == TableStatus.RESERVED) {
                table.setCurrentOrderId(null);
            }
        }
        CafeTable saved = tableRepository.save(table);
        messaging.convertAndSend("/topic/tables", saved);
        return saved;
    }

    @Transactional
    public void deleteTable(UUID id) {
        tableRepository.findById(id).ifPresent(t -> { t.setDeleted(true); tableRepository.save(t); });
    }

    /** Merge all lines from sourceTable's open order into targetTable's open order */
    @Transactional
    public String mergeTables(UUID sourceTableId, UUID targetTableId) {
        if (sourceTableId.equals(targetTableId))
            throw BusinessException.conflict("Cannot merge a table with itself");
        CafeTable source = tableRepository.findById(sourceTableId).orElseThrow(() -> BusinessException.notFound("Source table"));
        CafeTable target = tableRepository.findById(targetTableId).orElseThrow(() -> BusinessException.notFound("Target table"));
        if (source.getCurrentOrderId() == null) throw new com.cafe.erp.shared.infrastructure.exception.BusinessException("Source table has no open order");
        if (target.getCurrentOrderId() == null) throw new com.cafe.erp.shared.infrastructure.exception.BusinessException("Target table has no open order");
        orderService.mergeOrders(source.getCurrentOrderId(), target.getCurrentOrderId());
        source.setStatus(TableStatus.FREE);
        source.setCurrentOrderId(null);
        tableRepository.save(source);
        messaging.convertAndSend("/topic/tables", source);
        return "Tables merged successfully";
    }

    /**
     * Waiter signals that the customer at this table has requested the bill.
     * Sets status to BILLING and broadcasts via WebSocket so the floor plan
     * immediately shows the 🟡 indicator on every connected screen.
     */
    @Transactional
    public CafeTable requestBill(UUID tableId) {
        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> BusinessException.notFound("Table"));
        if (table.getStatus() != TableStatus.OCCUPIED)
            throw new com.cafe.erp.shared.infrastructure.exception.BusinessException(
                    "Table must be OCCUPIED to request bill (current: " + table.getStatus() + ")");
        table.setStatus(TableStatus.BILLING);
        CafeTable saved = tableRepository.save(table);
        messaging.convertAndSend("/topic/tables", saved);
        return saved;
    }

    /** Revert BILLING back to OCCUPIED — e.g. customer ordered more items */
    @Transactional
    public CafeTable cancelBillRequest(UUID tableId) {
        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> BusinessException.notFound("Table"));
        if (table.getStatus() != TableStatus.BILLING)
            throw new com.cafe.erp.shared.infrastructure.exception.BusinessException(
                    "Table is not in BILLING status");
        table.setStatus(TableStatus.OCCUPIED);
        CafeTable saved = tableRepository.save(table);
        messaging.convertAndSend("/topic/tables", saved);
        return saved;
    }
}
