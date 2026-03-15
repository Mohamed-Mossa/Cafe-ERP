package com.cafe.erp.shift.application.service;
import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.pos.infrastructure.persistence.OrderRepository;
import com.cafe.erp.shift.application.command.*;
import com.cafe.erp.shift.domain.model.*;
import com.cafe.erp.shift.infrastructure.persistence.*;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

@Service @RequiredArgsConstructor
public class ShiftService {
    private final ShiftRepository shiftRepository;
    private final PettyExpenseRepository expenseRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional
    public Shift openShift(OpenShiftRequest req) {
        User user = SecurityUtils.currentUser();
        shiftRepository.findByCashierIdAndStatus(user.getId(), ShiftStatus.OPEN)
                .ifPresent(s -> { throw BusinessException.conflict("You already have an open shift"); });
        return shiftRepository.save(Shift.builder().cashierId(user.getId()).cashierName(user.getFullName())
                .openingBalance(req.getOpeningBalance()).status(ShiftStatus.OPEN).build());
    }

    @Transactional
    public Shift addExpense(UUID shiftId, AddExpenseRequest req) {
        Shift shift = getOpenShift(shiftId);
        expenseRepository.save(PettyExpense.builder().shiftId(shiftId)
                .description(req.getDescription()).amount(req.getAmount())
                .category(req.getCategory()).receiptRef(req.getReceiptRef()).build());
        shift.setTotalExpenses(expenseRepository.sumByShiftId(shiftId));
        return shiftRepository.save(shift);
    }

    @Transactional
    public Shift closeShift(UUID shiftId, CloseShiftRequest req) {
        Shift shift = getOpenShift(shiftId);
        LocalDateTime now = LocalDateTime.now();
        var closedOrders = orderRepository.findByClosedAtBetweenAndDeletedFalse(shift.getCreatedAt(), now);
        BigDecimal totalSales = closedOrders.stream()
                .map(o -> o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expenses = expenseRepository.sumByShiftId(shiftId);
        BigDecimal expectedCash = shift.getOpeningBalance().add(totalSales).subtract(expenses);
        shift.setTotalSales(totalSales); shift.setTotalExpenses(expenses);
        shift.setExpectedCash(expectedCash); shift.setActualCash(req.getActualCash());
        shift.setCashVariance(req.getActualCash().subtract(expectedCash));
        shift.setNetCash(req.getActualCash().subtract(shift.getOpeningBalance()));
        shift.setStatus(ShiftStatus.CLOSED); shift.setClosedAt(now); shift.setClosingNotes(req.getClosingNotes());
        return shiftRepository.save(shift);
    }

    public Optional<Shift> getCurrentShift() {
        User user = SecurityUtils.currentUser();
        return shiftRepository.findByCashierIdAndStatus(user.getId(), ShiftStatus.OPEN);
    }

    public List<PettyExpense> getShiftExpenses(UUID shiftId) { return expenseRepository.findByShiftId(shiftId); }
    public Shift getShift(UUID id) { return shiftRepository.findById(id).orElseThrow(() -> BusinessException.notFound("Shift")); }
    private Shift getOpenShift(UUID id) {
        Shift s = getShift(id);
        if (s.getStatus() != ShiftStatus.OPEN) throw new BusinessException("Shift already closed", HttpStatus.BAD_REQUEST);
        return s;
    }

    public java.util.List<com.cafe.erp.shift.domain.model.Shift> getAllShifts() {
        return shiftRepository.findAllByOrderByCreatedAtDesc();
    }
}
