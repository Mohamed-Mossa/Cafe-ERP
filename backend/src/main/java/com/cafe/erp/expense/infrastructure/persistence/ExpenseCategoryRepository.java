package com.cafe.erp.expense.infrastructure.persistence;
import com.cafe.erp.expense.domain.model.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, UUID> {
    List<ExpenseCategory> findByActiveOrderByParentCategoryAscNameAsc(boolean active);
    List<ExpenseCategory> findAllByOrderByParentCategoryAscNameAsc();
}
