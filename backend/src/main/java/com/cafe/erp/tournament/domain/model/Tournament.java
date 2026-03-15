package com.cafe.erp.tournament.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "tournaments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tournament extends BaseEntity {
    @Column(nullable = false, length = 150) private String name;
    @Column(nullable = false, length = 100) private String gameName;
    @Column(nullable = false) private LocalDate tournamentDate;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default private BigDecimal entryFee = BigDecimal.ZERO;
    @Column(nullable = false) @Builder.Default private int maxPlayers = 16;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default private BigDecimal prizePool = BigDecimal.ZERO;
    @Column(nullable = false, length = 20) @Builder.Default private String status = "UPCOMING";
    @Column(columnDefinition = "TEXT") private String notes;
    private UUID cashierId;
}
