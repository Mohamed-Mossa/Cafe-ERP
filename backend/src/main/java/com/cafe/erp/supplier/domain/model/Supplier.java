package com.cafe.erp.supplier.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity @Table(name = "suppliers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Supplier {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable=false) private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    @Column(columnDefinition="TEXT") private String notes;
    @Column(nullable=false) @Builder.Default private boolean active = true;
    @Column(nullable=false) @Builder.Default private boolean deleted = false;
    @Column(nullable=false, updatable=false)
    @Builder.Default private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
}
