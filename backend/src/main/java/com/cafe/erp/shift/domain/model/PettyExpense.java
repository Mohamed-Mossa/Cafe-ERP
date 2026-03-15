package com.cafe.erp.shift.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name = "petty_expenses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PettyExpense extends BaseEntity {
    @Column(nullable = false) private UUID shiftId;
    @Column(nullable = false, length = 200) private String description;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Column(length = 100) private String category;
    private String receiptRef;
}
