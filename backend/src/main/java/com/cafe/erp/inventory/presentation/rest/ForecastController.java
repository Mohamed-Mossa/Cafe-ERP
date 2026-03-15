package com.cafe.erp.inventory.presentation.rest;

import com.cafe.erp.inventory.infrastructure.persistence.InventoryItemRepository;
import com.cafe.erp.inventory.infrastructure.persistence.StockLedgerRepository;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/inventory/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final InventoryItemRepository itemRepository;
    private final StockLedgerRepository ledgerRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getForecast() {
        var items = itemRepository.findByDeletedFalseOrderByName();
        var cutoff = LocalDateTime.now().minusDays(30);
        var result = new ArrayList<Map<String, Object>>();

        for (var item : items) {
            // Sum of outbound (negative quantity) deductions in last 30 days
            var ledger = ledgerRepository.findByInventoryItemIdOrderByCreatedAtDesc(item.getId());
            BigDecimal totalOut = ledger.stream()
                .filter(l -> l.getCreatedAt().isAfter(cutoff))
                .filter(l -> l.getQuantity().compareTo(BigDecimal.ZERO) < 0)
                .map(l -> l.getQuantity().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal avgDailyUsage = totalOut.compareTo(BigDecimal.ZERO) > 0
                ? totalOut.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

            Integer daysRemaining = null;
            if (avgDailyUsage.compareTo(BigDecimal.ZERO) > 0 && item.getCurrentStock().compareTo(BigDecimal.ZERO) > 0) {
                daysRemaining = item.getCurrentStock()
                    .divide(avgDailyUsage, 0, RoundingMode.FLOOR).intValue();
            }

            var row = new LinkedHashMap<String, Object>();
            row.put("id", item.getId());
            row.put("name", item.getName());
            row.put("unit", item.getUnit());
            row.put("currentStock", item.getCurrentStock());
            row.put("reorderLevel", item.getReorderLevel());
            row.put("avgDailyUsage", avgDailyUsage);
            row.put("daysRemaining", daysRemaining);
            row.put("category", item.getCategory());
            result.add(row);
        }
        result.sort(Comparator.comparingInt(r -> {
            Integer d = (Integer) r.get("daysRemaining");
            return d == null ? Integer.MAX_VALUE : d;
        }));
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
