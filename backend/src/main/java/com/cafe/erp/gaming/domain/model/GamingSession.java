package com.cafe.erp.gaming.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "gaming_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GamingSession extends BaseEntity {
    @Column(nullable = false) private UUID deviceId;
    @Column(nullable = false, length = 50) private String deviceName;
    @Column(nullable = false) private UUID cashierId;
    @Column(nullable = false) private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default private SessionStatus status = SessionStatus.ACTIVE;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private SessionType currentType;
    @Column(nullable = false, precision = 10, scale = 2) @Builder.Default private BigDecimal gamingAmount = BigDecimal.ZERO;
    private Integer totalMinutes;
    private UUID linkedOrderId;
    private UUID customerId;
    @JsonIgnore
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @Builder.Default private List<SessionSegment> segments = new ArrayList<>();
}