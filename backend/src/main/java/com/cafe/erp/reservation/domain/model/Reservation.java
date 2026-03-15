package com.cafe.erp.reservation.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity @Table(name = "reservations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reservation {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable=false) private String customerName;
    @Column(nullable=false) private String customerPhone;
    private UUID tableId;
    private String tableName;
    @Column(nullable=false) @Builder.Default private int partySize = 2;
    @Column(nullable=false) private LocalDate reservationDate;
    @Column(nullable=false) private LocalTime reservationTime;
    @Column(nullable=false) @Builder.Default private int durationMinutes = 120;
    @Column(precision=10,scale=2) @Builder.Default private BigDecimal depositAmount = BigDecimal.ZERO;
    @Builder.Default private boolean depositPaid = false;
    @Column(nullable=false) @Builder.Default private String status = "PENDING";
    @Column(columnDefinition="TEXT") private String notes;
    private UUID cashierId;
    @Column(nullable=false) @Builder.Default private boolean deleted = false;
    @Column(nullable=false, updatable=false)
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default private LocalDateTime updatedAt = LocalDateTime.now();
    @PrePersist void onCreate() { if (updatedAt == null) updatedAt = LocalDateTime.now(); }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
