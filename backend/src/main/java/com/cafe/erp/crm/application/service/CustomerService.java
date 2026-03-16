package com.cafe.erp.crm.application.service;
import com.cafe.erp.crm.application.command.*;
import com.cafe.erp.crm.domain.model.*;
import com.cafe.erp.crm.infrastructure.persistence.*;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal; import java.math.RoundingMode;
import java.util.List; import java.util.UUID;

@Service @RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;
    private final PointTransactionRepository pointTxRepository;

    @Value("${app.loyalty.points-per-100:10}") private int pointsPer100;
    @Value("${app.loyalty.points-to-egp-rate:0.10}") private BigDecimal pointsToEgpRate;

    @Transactional
    public Customer createCustomer(CreateCustomerRequest req) {
        if (customerRepository.existsByPhone(req.getPhone()))
            throw BusinessException.conflict("Phone number already registered");
        return customerRepository.save(Customer.builder()
                .phone(req.getPhone()).fullName(req.getFullName()).email(req.getEmail()).build());
    }

    public Customer lookupByPhone(String phone) {
        return customerRepository.findByPhoneAndDeletedFalse(phone)
                .orElseThrow(() -> BusinessException.notFound("Customer"));
    }

    @Transactional
    public Customer earnPoints(UUID customerId, BigDecimal orderAmount, UUID orderId) {
        Customer customer = customerRepository.findById(customerId).orElseThrow();
        int points = orderAmount.divide(BigDecimal.valueOf(100), 0, RoundingMode.FLOOR)
                .multiply(BigDecimal.valueOf(pointsPer100)).intValue();
        if (points <= 0) return customer;

        customer.setTotalPoints(customer.getTotalPoints() + points);
        customer.setTotalSpent(customer.getTotalSpent().add(orderAmount));
        updateTier(customer);

        pointTxRepository.save(PointTransaction.builder()
                .customerId(customerId).points(points).type("EARN")
                .description("Order #" + orderId).orderId(orderId)
                .orderAmount(orderAmount).balanceAfter(customer.getTotalPoints()).build());
        return customerRepository.save(customer);
    }

    @Transactional
    public BigDecimal redeemPoints(UUID customerId, RedeemPointsRequest req) {
        Customer customer = customerRepository.findById(customerId).orElseThrow();
        if (customer.getTotalPoints() < req.getPoints())
            throw new BusinessException("Insufficient points. Available: " + customer.getTotalPoints());

        BigDecimal discount = BigDecimal.valueOf(req.getPoints()).multiply(pointsToEgpRate)
                .setScale(2, RoundingMode.HALF_UP);
        customer.setTotalPoints(customer.getTotalPoints() - req.getPoints());
        updateTier(customer);

        pointTxRepository.save(PointTransaction.builder()
                .customerId(customerId).points(-req.getPoints()).type("REDEEM")
                .description("Redeemed for " + discount + " EGP discount")
                .orderId(req.getOrderId()).balanceAfter(customer.getTotalPoints()).build());
        customerRepository.save(customer);
        return discount;
    }

    public List<PointTransaction> getPointHistory(UUID customerId) {
        return pointTxRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    private void updateTier(Customer c) {
        // Spec defines tiers by accumulated loyalty points, not EGP spend
        if (c.getTotalPoints() >= 1500) c.setTier(CustomerTier.GOLD);
        else if (c.getTotalPoints() >= 500) c.setTier(CustomerTier.SILVER);
        else c.setTier(CustomerTier.BRONZE);
    }

    @org.springframework.transaction.annotation.Transactional
    public java.math.BigDecimal deductCredit(UUID customerId, java.math.BigDecimal amount) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new com.cafe.erp.shared.infrastructure.exception.BusinessException("Customer not found"));

        java.math.BigDecimal newBalance = customer.getCreditBalance().subtract(amount);

        // Allow balance to go negative down to -creditLimit (the spec's "debt" model).
        // If creditLimit is 0 (not set), the balance cannot go below 0.
        java.math.BigDecimal floor = customer.getCreditLimit().negate();
        if (newBalance.compareTo(floor) < 0) {
            throw new com.cafe.erp.shared.infrastructure.exception.BusinessException(
                "Credit limit exceeded. Available credit + limit: "
                + customer.getCreditBalance().add(customer.getCreditLimit()) + " EGP");
        }

        customer.setCreditBalance(newBalance);
        customerRepository.save(customer);
        return customer.getCreditBalance();
    }

    public java.math.BigDecimal getCreditBalance(UUID customerId) {
        return customerRepository.findById(customerId)
            .map(Customer::getCreditBalance)
            .orElse(java.math.BigDecimal.ZERO);
    }

    @Transactional
    public java.math.BigDecimal topUpCredit(UUID customerId, java.math.BigDecimal amount, String note) {
        if (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0)
            throw new com.cafe.erp.shared.infrastructure.exception.BusinessException("Top-up amount must be greater than zero");
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new com.cafe.erp.shared.infrastructure.exception.BusinessException("Customer not found"));
        customer.setCreditBalance(customer.getCreditBalance().add(amount));
        customerRepository.save(customer);
        return customer.getCreditBalance();
    }
}
