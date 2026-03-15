package com.cafe.erp.gaming.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "devices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Device extends BaseEntity {
    @Column(nullable = false, length = 50) private String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private DeviceType type;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal singleRate;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal multiRate;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default private DeviceStatus status = DeviceStatus.FREE;
    @Column(name = "position_x", nullable = false) @Builder.Default private int positionX = 0;
    @Column(name = "position_y", nullable = false) @Builder.Default private int positionY = 0;
    @Builder.Default private boolean active = true;
}
