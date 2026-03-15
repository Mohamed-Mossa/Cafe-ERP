package com.cafe.erp.expense.application.service;

import com.cafe.erp.expense.domain.model.Expense;
import com.cafe.erp.expense.domain.model.ExpenseCategory;
import com.cafe.erp.expense.infrastructure.persistence.ExpenseCategoryRepository;
import com.cafe.erp.expense.infrastructure.persistence.ExpenseRepository;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class ExpenseService {
    private final ExpenseRepository expenseRepo;
    private final ExpenseCategoryRepository categoryRepo;

    public List<ExpenseCategory> getCategories() { return categoryRepo.findAllByOrderByParentCategoryAscNameAsc(); }

    public List<Expense> getExpenses(String from, String to) {
        if (from != null && to != null) {
            return expenseRepo.findByExpenseDateBetweenAndDeletedFalseOrderByExpenseDateDesc(
                LocalDate.parse(from), LocalDate.parse(to));
        }
        return expenseRepo.findByDeletedFalseOrderByExpenseDateDescCreatedAtDesc();
    }

    @Transactional
    public Expense createExpense(Map<String, Object> body) {
        var user = SecurityUtils.currentUser();
        UUID catId = body.get("categoryId") != null ? UUID.fromString((String) body.get("categoryId")) : null;
        String catName = (String) body.getOrDefault("categoryName", "Other");
        if (catId != null) {
            catName = categoryRepo.findById(catId).map(ExpenseCategory::getName).orElse(catName);
        }
        return expenseRepo.save(Expense.builder()
            .categoryId(catId)
            .categoryName(catName)
            .amount(new BigDecimal(body.get("amount").toString()))
            .description((String) body.get("description"))
            .expenseDate(body.get("expenseDate") != null ? LocalDate.parse((String) body.get("expenseDate")) : LocalDate.now())
            .shiftId(body.get("shiftId") != null ? UUID.fromString((String) body.get("shiftId")) : null)
            .recordedById(user.getId())
            .recordedByName(user.getFullName())
            .build());
    }

    @Transactional
    public void delete(UUID id) {
        expenseRepo.findById(id).ifPresent(e -> { e.setDeleted(true); expenseRepo.save(e); });
    }

    @Transactional
    public ExpenseCategory createCategory(Map<String, Object> body) {
        return categoryRepo.save(ExpenseCategory.builder()
            .name((String) body.get("name"))
            .parentCategory((String) body.getOrDefault("parentCategory", "MISC"))
            .build());
    }
}
