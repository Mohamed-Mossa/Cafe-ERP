package com.cafe.erp.tournament.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "tournament_players")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TournamentPlayer extends BaseEntity {
    @Column(nullable = false) private UUID tournamentId;
    @Column(nullable = false, length = 100) private String playerName;
    @Column(length = 20) private String playerPhone;
    private UUID customerId;
    @Column(nullable = false) @Builder.Default private boolean feePaid = false;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default private BigDecimal feeAmount = BigDecimal.ZERO;
    private Integer rank;
    @Column(nullable = false) @Builder.Default private boolean checkedIn = false;
    @Column(columnDefinition = "TEXT") private String notes;
    private UUID cashierId;
}
