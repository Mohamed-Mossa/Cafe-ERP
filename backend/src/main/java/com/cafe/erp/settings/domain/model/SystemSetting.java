package com.cafe.erp.settings.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "system_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemSetting {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true, length = 100) private String settingKey;
    @Column(columnDefinition = "TEXT") private String settingValue;
    @Column(length = 300) private String description;
    @Column(nullable = false) @Builder.Default private LocalDateTime updatedAt = LocalDateTime.now();
}
