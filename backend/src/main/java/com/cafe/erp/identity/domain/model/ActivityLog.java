package com.cafe.erp.identity.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(length = 50)
    private String entityType;

    private UUID entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    private String ipAddress;

    @Column(nullable = false, updatable = false)
    private LocalDateTime performedAt;

    @PrePersist
    void prePersist() { this.performedAt = LocalDateTime.now(); }
}
