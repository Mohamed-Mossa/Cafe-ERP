package com.cafe.erp.gaming.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "session_segments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionSegment extends BaseEntity {

    // ManyToOne back-reference so Hibernate writes session_id on INSERT
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GamingSession session;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private SessionType sessionType;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal rate;
    @Column(nullable = false) private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer durationMinutes;
    @Column(precision = 10, scale = 2) private BigDecimal amount;
}
