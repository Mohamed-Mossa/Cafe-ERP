package com.cafe.erp.pos.infrastructure.persistence;
import com.cafe.erp.pos.domain.model.Order;
import com.cafe.erp.pos.domain.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByStatusAndDeletedFalse(OrderStatus status);
    List<Order> findByTableIdAndStatusAndDeletedFalse(UUID tableId, OrderStatus status);
    Optional<Order> findByDeviceIdAndStatusAndDeletedFalse(UUID deviceId, OrderStatus status);

    @Query("SELECT MAX(o.orderNumber) FROM Order o")
    Long findMaxOrderNumber();

    List<Order> findByClosedAtBetweenAndDeletedFalse(LocalDateTime start, LocalDateTime end);
    List<Order> findByCashierIdAndClosedAtBetweenAndDeletedFalse(UUID cashierId, LocalDateTime start, LocalDateTime end);
}
