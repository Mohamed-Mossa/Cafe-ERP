package com.cafe.erp.expense.domain.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "expense_categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExpenseCategory {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true, length = 100) private String name;
    @Column(length = 50) private String parentCategory;
    @Column(nullable = false) @Builder.Default private boolean active = true;
    @Column(nullable = false) @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
