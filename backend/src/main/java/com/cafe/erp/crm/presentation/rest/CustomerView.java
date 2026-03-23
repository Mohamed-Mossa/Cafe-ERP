package com.cafe.erp.crm.presentation.rest;

import com.cafe.erp.crm.domain.model.Customer;
import com.cafe.erp.crm.domain.model.CustomerTier;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record CustomerView(
        UUID id,
        String fullName,
        String phone,
        boolean phoneVisible,
        String email,
        CustomerTier tier,
        BigDecimal creditBalance,
        BigDecimal creditLimit,
        int totalPoints,
        BigDecimal totalSpent,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CustomerView from(Customer customer, boolean canViewPhone) {
        return new CustomerView(
                customer.getId(),
                customer.getFullName(),
                canViewPhone ? customer.getPhone() : null,
                canViewPhone,
                customer.getEmail(),
                customer.getTier(),
                customer.getCreditBalance(),
                customer.getCreditLimit(),
                customer.getTotalPoints(),
                customer.getTotalSpent(),
                customer.isActive(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}
