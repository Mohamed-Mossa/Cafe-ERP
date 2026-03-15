package com.cafe.erp.happyhour.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

@Entity @Table(name = "happy_hours")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HappyHour {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable=false) private String name;
    @Column(nullable=false, precision=5, scale=2) private BigDecimal discountPercent;
    @Column(nullable=false) private LocalTime startTime;
    @Column(nullable=false) private LocalTime endTime;
    @Column(nullable=false) @Builder.Default private String daysOfWeek = "MON,TUE,WED,THU,FRI,SAT,SUN";
    @Column(nullable=false) @Builder.Default private boolean active = true;
    @Column(nullable=false) @Builder.Default private boolean deleted = false;
}
