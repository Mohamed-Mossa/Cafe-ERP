package com.cafe.erp.reporting.application.service;

import com.cafe.erp.crm.presentation.rest.CustomerView;
import com.cafe.erp.pos.infrastructure.persistence.OrderRepository;
import com.cafe.erp.gaming.infrastructure.persistence.GamingSessionRepository;
import com.cafe.erp.shift.infrastructure.persistence.ShiftRepository;
import com.cafe.erp.inventory.infrastructure.persistence.InventoryItemRepository;
import com.cafe.erp.crm.infrastructure.persistence.CustomerRepository;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class ReportService {
    private final OrderRepository orderRepository;
    private final GamingSessionRepository gamingSessionRepository;
    private final ShiftRepository shiftRepository;
    private final InventoryItemRepository inventoryRepository;
    private final CustomerRepository customerRepository;
    private final com.cafe.erp.identity.infrastructure.persistence.UserRepository userRepository;

    public Map<String, Object> getDashboard() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime now = LocalDateTime.now();

        var todayOrders = orderRepository.findByClosedAtBetweenAndDeletedFalse(startOfDay, now);

        BigDecimal todaySales = todayOrders.stream()
                .map(o -> o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long openOrders = orderRepository.findByStatusAndDeletedFalse(
                com.cafe.erp.pos.domain.model.OrderStatus.OPEN).size();

        long activeSessions = gamingSessionRepository.findByStatus(
                com.cafe.erp.gaming.domain.model.SessionStatus.ACTIVE).size();

        long lowStockAlerts = inventoryRepository.findLowStockItems().size();

        return Map.of(
                "todaySales", todaySales,
                "todayOrderCount", todayOrders.size(),
                "openOrders", openOrders,
                "activeSessions", activeSessions,
                "lowStockAlerts", lowStockAlerts,
                "generatedAt", now.toString()
        );
    }

    public Map<String, Object> getSalesReport(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to);

        BigDecimal totalRevenue = orders.stream()
                .map(o -> o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscount = orders.stream()
                .map(o -> o.getDiscountAmount() != null ? o.getDiscountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Sales breakdown by source
        Map<String, Long> bySource = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueBySource = new LinkedHashMap<>();
        orders.forEach(o -> {
            String src = o.getSource().name();
            bySource.merge(src, 1L, Long::sum);
            revenueBySource.merge(src, o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO, BigDecimal::add);
        });

        return Map.of(
                "from", from.toString(), "to", to.toString(),
                "orderCount", orders.size(),
                "totalRevenue", totalRevenue,
                "totalDiscount", totalDiscount,
                "ordersBySource", bySource,
                "revenueBySource", revenueBySource
        );
    }


    public Map<String, Object> getShiftsReport(LocalDateTime from, LocalDateTime to) {
        var shifts = shiftRepository.findAll().stream()
            .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(from) && !s.getCreatedAt().isAfter(to))
            .toList();
        BigDecimal totalSales = shifts.stream()
            .map(s -> s.getTotalSales() != null ? s.getTotalSales() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpenses = shifts.stream()
            .map(s -> s.getTotalExpenses() != null ? s.getTotalExpenses() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalVariance = shifts.stream()
            .filter(s -> s.getCashVariance() != null)
            .map(com.cafe.erp.shift.domain.model.Shift::getCashVariance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
            "shiftCount", shifts.size(), "totalSales", totalSales,
            "totalExpenses", totalExpenses, "totalCashVariance", totalVariance,
            "shifts", shifts, "from", from.toString(), "to", to.toString());
    }

    public Map<String, Object> getGamingReport(LocalDateTime from, LocalDateTime to) {
        var sessions = gamingSessionRepository.findByStartedAtBetween(from, to);
        BigDecimal totalRevenue = sessions.stream()
            .map(s -> s.getGamingAmount() != null ? s.getGamingAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalMinutes = sessions.stream()
            .mapToLong(s -> s.getTotalMinutes() != null ? s.getTotalMinutes() : 0).sum();
        Map<String, Long> byDevice = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueByDevice = new LinkedHashMap<>();
        Map<String, Long> byType = new LinkedHashMap<>();
        sessions.forEach(s -> {
            byDevice.merge(s.getDeviceName(), 1L, Long::sum);
            revenueByDevice.merge(s.getDeviceName(), s.getGamingAmount() != null ? s.getGamingAmount() : BigDecimal.ZERO, BigDecimal::add);
            byType.merge(s.getCurrentType().name(), 1L, Long::sum);
        });
        return Map.of("sessionCount", sessions.size(), "totalRevenue", totalRevenue,
            "totalMinutes", totalMinutes, "sessionsByDevice", byDevice,
            "revenueByDevice", revenueByDevice, "sessionsByType", byType,
            "from", from.toString(), "to", to.toString());
    }

    public Map<String, Object> getInventoryValueReport() {
        var items = inventoryRepository.findAll().stream().filter(i -> Boolean.TRUE.equals(i.getIsActive())).toList();
        BigDecimal totalValue = items.stream()
            .map(i -> i.getCurrentStock().multiply(i.getAverageCost()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        long lowStockCount = items.stream()
            .filter(i -> i.getCurrentStock().compareTo(i.getReorderLevel()) <= 0).count();
        long outOfStockCount = items.stream()
            .filter(i -> i.getCurrentStock().compareTo(BigDecimal.ZERO) <= 0).count();
        Map<String, BigDecimal> valueByCategory = new LinkedHashMap<>();
        items.forEach(i -> {
            String cat = i.getCategory() != null && !i.getCategory().isBlank() ? i.getCategory() : "Uncategorized";
            valueByCategory.merge(cat, i.getCurrentStock().multiply(i.getAverageCost()), BigDecimal::add);
        });
        return Map.of("totalItems", items.size(), "totalStockValue", totalValue,
            "lowStockCount", lowStockCount, "outOfStockCount", outOfStockCount,
            "valueByCategory", valueByCategory, "items", items);
    }

    public Map<String, Object> getLoyaltyReport() {
        var customers = customerRepository.findAll().stream().filter(c -> !c.isDeleted()).toList();
        boolean canViewPhone = SecurityUtils.hasRole("OWNER");
        int totalPoints = customers.stream().mapToInt(com.cafe.erp.crm.domain.model.Customer::getTotalPoints).sum();
        BigDecimal totalSpent = customers.stream()
            .map(com.cafe.erp.crm.domain.model.Customer::getTotalSpent)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Long> byTier = new LinkedHashMap<>();
        customers.forEach(c -> byTier.merge(c.getTier().name(), 1L, Long::sum));
        var topSpenders = customers.stream()
            .sorted((a,b) -> b.getTotalSpent().compareTo(a.getTotalSpent()))
            .limit(10)
            .map(customer -> CustomerView.from(customer, canViewPhone))
            .toList();
        return Map.of("totalCustomers", customers.size(), "totalPointsInCirculation", totalPoints,
            "totalLifetimeSpend", totalSpent, "customersByTier", byTier, "topSpenders", topSpenders);
    }

    public Map<String, Object> getTopProductsReport(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to);
        Map<String, Map<String, Object>> productMap = new LinkedHashMap<>();
        for (var order : orders) {
            for (var line : order.getLines()) {
                String name = line.getProductName();
                productMap.compute(name, (k, v) -> {
                    if (v == null) v = new LinkedHashMap<>(Map.of("name", name, "qty", 0L, "revenue", BigDecimal.ZERO));
                    v.put("qty", (Long) v.get("qty") + (long) line.getQuantity());
                    v.put("revenue", ((BigDecimal) v.get("revenue")).add(line.getTotalPrice() != null ? line.getTotalPrice() : BigDecimal.ZERO));
                    return v;
                });
            }
        }
        var sorted = productMap.values().stream()
            .sorted((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")))
            .toList();
        BigDecimal totalRevenue = sorted.stream()
            .map(p -> (BigDecimal) p.get("revenue")).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("topProducts", sorted, "totalRevenue", totalRevenue, "productCount", sorted.size());
    }

    public Map<String, Object> getProfitReport(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to);
        BigDecimal totalRevenue = orders.stream()
            .map(o -> o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalOrders = orders.size();
        Map<String, BigDecimal> revenueByPayment = new LinkedHashMap<>();
        for (var order : orders) {
            if (order.getPayments() != null) {
                for (var p : order.getPayments()) {
                    revenueByPayment.merge(p.getMethod().name(), p.getAmount(), BigDecimal::add);
                }
            }
        }
        Map<String, BigDecimal> revenueBySource = new LinkedHashMap<>();
        orders.forEach(o -> revenueBySource.merge(o.getSource().name(), o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO, BigDecimal::add));
        return Map.of("totalRevenue", totalRevenue, "totalOrders", totalOrders,
            "revenueByPaymentMethod", revenueByPayment, "revenueBySource", revenueBySource,
            "averageOrderValue", totalOrders > 0 ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
    }

    /** ABC Analysis: classify products into A (top 20% revenue), B (next 30%), C (bottom 50%) */
    public Map<String, Object> getAbcAnalysis(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to);
        Map<String, Map<String, Object>> productMap = new LinkedHashMap<>();
        for (var order : orders) {
            for (var line : order.getLines()) {
                String name = line.getProductName();
                productMap.compute(name, (k, v) -> {
                    if (v == null) v = new LinkedHashMap<>(Map.of("name", name, "qty", 0L, "revenue", BigDecimal.ZERO));
                    v.put("qty", (Long) v.get("qty") + (long) line.getQuantity());
                    v.put("revenue", ((BigDecimal) v.get("revenue")).add(line.getTotalPrice() != null ? line.getTotalPrice() : BigDecimal.ZERO));
                    return v;
                });
            }
        }
        var sorted = new java.util.ArrayList<>(productMap.values());
        sorted.sort((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")));
        BigDecimal totalRevenue = sorted.stream().map(p -> (BigDecimal) p.get("revenue")).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal runningTotal = BigDecimal.ZERO;
        for (var product : sorted) {
            BigDecimal rev = (BigDecimal) product.get("revenue");
            runningTotal = runningTotal.add(rev);
            BigDecimal pct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? runningTotal.divide(totalRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
            product.put("cumulativePct", pct);
            if (pct.compareTo(BigDecimal.valueOf(70)) <= 0) product.put("abcClass", "A");
            else if (pct.compareTo(BigDecimal.valueOf(90)) <= 0) product.put("abcClass", "B");
            else product.put("abcClass", "C");
        }
        long classA = sorted.stream().filter(p -> "A".equals(p.get("abcClass"))).count();
        long classB = sorted.stream().filter(p -> "B".equals(p.get("abcClass"))).count();
        long classC = sorted.stream().filter(p -> "C".equals(p.get("abcClass"))).count();
        return Map.of("products", sorted, "totalRevenue", totalRevenue,
            "classACount", classA, "classBCount", classB, "classCCount", classC);
    }

    /** Peak hours heatmap: orders count by day-of-week and hour */
    public Map<String, Object> getPeakHours(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to);
        // hour -> count
        Map<Integer, Long> byHour = new LinkedHashMap<>();
        for (int h = 0; h < 24; h++) byHour.put(h, 0L);
        // day -> count (1=Monday ... 7=Sunday)
        Map<String, Long> byDay = new LinkedHashMap<>();
        String[] days = {"MON","TUE","WED","THU","FRI","SAT","SUN"};
        for (String d : days) byDay.put(d, 0L);

        for (var order : orders) {
            if (order.getClosedAt() == null) continue;
            int hour = order.getClosedAt().getHour();
            byHour.merge(hour, 1L, Long::sum);
            int dayVal = order.getClosedAt().getDayOfWeek().getValue(); // 1=Mon
            byDay.merge(days[dayVal - 1], 1L, Long::sum);
        }
        int peakHour = byHour.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(-1);
        String peakDay = byDay.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("N/A");
        return Map.of("byHour", byHour, "byDay", byDay, "peakHour", peakHour, "peakDay", peakDay, "totalOrders", orders.size());
    }

    /** Cashier performance: sales, order count, avg ticket, cash variance per employee */
    public Map<String, Object> getCashierPerformance(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to);
        var shifts = shiftRepository.findAll().stream()
            .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(from) && !s.getCreatedAt().isAfter(to))
            .toList();

        Map<String, Map<String, Object>> cashierMap = new LinkedHashMap<>();
        for (var order : orders) {
            String name = order.getCashierName() != null ? order.getCashierName() : "Unknown";
            cashierMap.compute(name, (k, v) -> {
                if (v == null) v = new LinkedHashMap<>(Map.of("name", name, "orderCount", 0L, "totalSales", BigDecimal.ZERO, "totalDiscount", BigDecimal.ZERO));
                v.put("orderCount", (Long) v.get("orderCount") + 1L);
                v.put("totalSales", ((BigDecimal) v.get("totalSales")).add(order.getGrandTotal() != null ? order.getGrandTotal() : BigDecimal.ZERO));
                v.put("totalDiscount", ((BigDecimal) v.get("totalDiscount")).add(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO));
                return v;
            });
        }
        // Add avg ticket
        cashierMap.values().forEach(c -> {
            long cnt = (Long) c.get("orderCount");
            BigDecimal sales = (BigDecimal) c.get("totalSales");
            c.put("avgTicket", cnt > 0 ? sales.divide(BigDecimal.valueOf(cnt), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        });
        // Add shift variance per cashier
        for (var shift : shifts) {
            if (shift.getCashierName() != null && shift.getCashVariance() != null) {
                cashierMap.compute(shift.getCashierName(), (k, v) -> {
                    if (v == null) v = new LinkedHashMap<>();
                    BigDecimal existing = v.containsKey("totalVariance") ? (BigDecimal) v.get("totalVariance") : BigDecimal.ZERO;
                    v.put("totalVariance", existing.add(shift.getCashVariance()));
                    return v;
                });
            }
        }
        var sorted = new java.util.ArrayList<>(cashierMap.values());
        sorted.sort((a, b) -> ((BigDecimal) b.get("totalSales")).compareTo((BigDecimal) a.get("totalSales")));
        return Map.of("cashiers", sorted, "from", from.toString(), "to", to.toString());
    }

    /** Table turnover: average times each table is occupied per day */
    public Map<String, Object> getTableTurnover(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to)
            .stream().filter(o -> o.getTableName() != null).toList();
        Map<String, Long> turnoverByTable = new LinkedHashMap<>();
        orders.forEach(o -> turnoverByTable.merge(o.getTableName(), 1L, Long::sum));
        long days = java.time.Duration.between(from, to).toDays();
        days = Math.max(1, days);
        long finalDays = days;
        Map<String, Double> avgPerDay = new LinkedHashMap<>();
        turnoverByTable.forEach((table, count) -> avgPerDay.put(table, (double) count / finalDays));
        return Map.of("turnoverByTable", turnoverByTable, "avgPerDayByTable", avgPerDay,
            "periodDays", finalDays, "totalTableOrders", orders.size());
    }
}
