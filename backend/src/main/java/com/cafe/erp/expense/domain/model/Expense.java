package com.cafe.erp.expense.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "expenses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense extends BaseEntity {
    private UUID categoryId;
    @Column(nullable = false, length = 100) private String categoryName;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(nullable = false) @Builder.Default private LocalDate expenseDate = LocalDate.now();
    private UUID shiftId;
    private UUID recordedById;
    @Column(length = 100) private String recordedByName;
}
