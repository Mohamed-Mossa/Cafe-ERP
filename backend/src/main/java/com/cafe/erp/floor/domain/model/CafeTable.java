package com.cafe.erp.floor.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity @Table(name = "cafe_tables")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CafeTable extends BaseEntity {
    @Column(nullable = false, unique = true, length = 30) private String name;
    @Column(nullable = false) @Builder.Default private int capacity = 4;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15) @Builder.Default
    private TableStatus status = TableStatus.FREE;
    private UUID currentOrderId;
    @Column(name = "position_x", nullable = false) @Builder.Default private int positionX = 0;
    @Column(name = "position_y", nullable = false) @Builder.Default private int positionY = 0;
}
