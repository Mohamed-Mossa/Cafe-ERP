package com.cafe.erp.reporting.presentation.rest;
import com.cafe.erp.reporting.application.service.ReportService;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime; import java.util.Map;

@RestController @RequestMapping("/reports") @RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDashboard()));
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getSalesReport(from, to)));
    }

    @GetMapping("/shifts")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> shiftsReport(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getShiftsReport(from, to)));
    }

    @GetMapping("/gaming")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> gamingReport(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getGamingReport(from, to)));
    }

    @GetMapping("/inventory-value")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> inventoryReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getInventoryValueReport()));
    }

    @GetMapping("/loyalty")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> loyaltyReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getLoyaltyReport()));
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> topProductsReport(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getTopProductsReport(from, to)));
    }

    @GetMapping("/profit")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> profitReport(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getProfitReport(from, to)));
    }

    @GetMapping("/abc-analysis")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> abcAnalysis(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getAbcAnalysis(from, to)));
    }

    @GetMapping("/peak-hours")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> peakHours(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getPeakHours(from, to)));
    }

    @GetMapping("/cashier-performance")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> cashierPerformance(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getCashierPerformance(from, to)));
    }

    @GetMapping("/table-turnover")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<java.util.Map<String,Object>>> tableTurnover(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getTableTurnover(from, to)));
    }
}
